import { type Request, type Response } from "express";
import UserDefault from "../models/User.ts";
import BMIRecordDefault from "../models/BMIRecord.ts";
import { getDbMode, getLastError } from "../config/db.ts";
import bcrypt from "bcryptjs";
import { GoogleGenAI, Type } from "@google/genai";
import { FOODS_DATABASE } from "../../src/data/foods.ts";

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ GEMINI_API_KEY environment variable is not defined. We will fall back to local matching search queries gracefully.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "PLACEHOLDER",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/**
 * Executes generateContent calls with robust automated exponential backoff
 * in order to handle typical transient cloud bottlenecks (such as 503 / 429 status codes).
 */
async function callGeminiWithRetry(ai: any, params: any, maxRetries = 3, initialDelayMs = 800): Promise<any> {
  let attempt = 0;
  let delay = initialDelayMs;
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const errMsg = String(err.message || err);
      const isTransient = errMsg.includes("503") || 
                          errMsg.includes("UNAVAILABLE") || 
                          errMsg.includes("429") || 
                          errMsg.includes("high demand") || 
                          errMsg.includes("Service Unavailable");

      if (isTransient && attempt < maxRetries) {
        console.warn(`⚠️ Gemini API transient error: "${errMsg}". Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }
}

// In-Memory databases fallback simulation for multiple users
const cacheUsers: any[] = [];
const cacheBmiRecords: any[] = [];

// Helper to calculate BMI
function calculateBmiValue(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
}

// Helper to classify BMI
function classifyBmiValue(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25.0) return "Healthy";
  if (bmi < 30.0) return "Overweight";
  return "Obesity";
}

/**
 * POST /signup
 * Creates a brand-new secure account
 */
export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Name, email, and password are required for signup.",
      });
    }

    const emailLower = email.toLowerCase().trim();
    const isFallback = getDbMode() === "fallback-memory";

    if (isFallback) {
      // Check existing email
      const existing = cacheUsers.find((u) => u.email === emailLower);
      if (existing) {
        return res.status(400).json({
          success: false,
          error: "An account with this email address already exists.",
        });
      }

      // Hash password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: `mem_user_${Date.now()}`,
        name,
        email: emailLower,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cacheUsers.push(newUser);

      // Safe clone omit password
      const { password: _, ...userToSend } = newUser;
      return res.status(200).json({
        success: true,
        message: "Signup successful (In-Memory Fallback Mode)",
        data: userToSend,
        databaseMode: "fallback-memory",
      });
    }

    // Live MongoDB path
    const existingMdb = await UserDefault.findOne({ email: emailLower } as any);
    if (existingMdb) {
      return res.status(400).json({
        success: false,
        error: "An account with this email address already exists.",
      });
    }

    const mdbUser = new UserDefault({
      name,
      email: emailLower,
      password, // will be hashed automatically by the pre-save schema hook
    });

    await mdbUser.save();

    // clone omit password
    const userToSend = {
      _id: mdbUser._id,
      name: mdbUser.name,
      email: mdbUser.email,
      createdAt: mdbUser.createdAt,
      updatedAt: mdbUser.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Signup successful in MongoDB Atlas Cluster",
      data: userToSend,
      databaseMode: "mongodb",
    });
  } catch (err: any) {
    console.error("Signup endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "Critical exception creating user account",
      details: err.message,
    });
  }
}

/**
 * POST /login
 * Authenticates user credentials and returns full profile mapping
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please specify both your registered email and account password.",
      });
    }

    const emailLower = email.toLowerCase().trim();
    const isFallback = getDbMode() === "fallback-memory";

    if (isFallback) {
      const user = cacheUsers.find((u) => u.email === emailLower);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: "No account registered under this email address. Please sign up first.",
        });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({
          success: false,
          error: "Incorrect password. Please try again.",
        });
      }

      // omit password
      const { password: _, ...userToSend } = user;
      return res.status(200).json({
        success: true,
        message: "Login secure. (Memory fallback active)",
        data: userToSend,
        databaseMode: "fallback-memory",
      });
    }

    // Live MongoDB mode
    const mdbUser = await UserDefault.findOne({ email: emailLower } as any);
    if (!mdbUser) {
      return res.status(401).json({
        success: false,
        error: "No account registered under this email address. Please sign up first.",
      });
    }

    const match = await mdbUser.comparePassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: "Incorrect password. Please try again.",
      });
    }

    // omit password
    const userToSend = {
      _id: mdbUser._id,
      name: mdbUser.name,
      email: mdbUser.email,
      age: mdbUser.age,
      gender: mdbUser.gender,
      height: mdbUser.height,
      weight: mdbUser.weight,
      activityLevel: mdbUser.activityLevel,
      bmiCategory: mdbUser.bmiCategory,
      createdAt: mdbUser.createdAt,
      updatedAt: mdbUser.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Login successfully verified!",
      data: userToSend,
      databaseMode: "mongodb",
    });
  } catch (err: any) {
    console.error("Login endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "Connection failure while logging in",
      details: err.message,
    });
  }
}

/**
 * POST /create-profile
 * Overwrites individual profile measurements
 */
export async function createProfile(req: Request, res: Response) {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Missing active session credential header: x-user-id",
      });
    }

    const { age, gender, height, weight, activityLevel } = req.body;

    if (!age || !gender || !height || !weight || !activityLevel) {
      return res.status(400).json({
        success: false,
        error: "Missing parameters. Required fields: age, gender, height, weight, activityLevel",
      });
    }

    const parsedAge = parseInt(age);
    const parsedHeight = parseFloat(height);
    const parsedWeight = parseFloat(weight);

    const bmiValue = calculateBmiValue(parsedWeight, parsedHeight);
    const bmiCategory = classifyBmiValue(bmiValue);

    const profileData = {
      age: parsedAge,
      gender,
      height: parsedHeight,
      weight: parsedWeight,
      activityLevel,
      bmiCategory,
    };

    const isFallback = getDbMode() === "fallback-memory";

    if (isFallback) {
      const idx = cacheUsers.findIndex((u) => u._id === userId);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          error: "No active user account found in memory matches this session ID.",
        });
      }

      // Update user document
      cacheUsers[idx] = {
        ...cacheUsers[idx],
        ...profileData,
        updatedAt: new Date().toISOString(),
      };

      // Also append a BMI history log automatically for trackability
      const newHistoryLog = {
        _id: `mem_log_${Date.now()}`,
        userId,
        weight: parsedWeight,
        height: parsedHeight,
        bmiValue,
        bmiCategory,
        recordedAt: new Date().toISOString(),
      };
      cacheBmiRecords.push(newHistoryLog);

      const { password: _, ...userToSend } = cacheUsers[idx];
      return res.status(200).json({
        success: true,
        message: "Profile configured successfully in Memory.",
        data: userToSend,
        databaseMode: "fallback-memory",
      });
    }

    // Live MongoDB mode path
    const mdbUser = await (UserDefault as any).findById(userId);
    if (!mdbUser) {
      return res.status(404).json({
        success: false,
        error: "User not found in live database.",
      });
    }

    mdbUser.age = parsedAge;
    mdbUser.gender = gender;
    mdbUser.height = parsedHeight;
    mdbUser.weight = parsedWeight;
    mdbUser.activityLevel = activityLevel;
    mdbUser.bmiCategory = bmiCategory;
    await mdbUser.save();

    // Cache record inside the separate historical ledger
    const log = new BMIRecordDefault({
      userId,
      weight: parsedWeight,
      height: parsedHeight,
      bmiValue,
      bmiCategory,
    });
    await log.save();

    return res.status(200).json({
      success: true,
      message: "Health profile synchronized inside MongoDB Atlas Cluster",
      data: mdbUser,
      databaseMode: "mongodb",
    });
  } catch (err: any) {
    console.error("createProfile endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "Exception creating health companion profile information",
      details: err.message,
    });
  }
}

/**
 * GET /get-profile
 * Fetches user profile data specific to their login instance
 */
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.headers["x-user-id"] || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthenticated request. Missing x-user-id session parameter.",
      });
    }

    const isFallback = getDbMode() === "fallback-memory";

    if (isFallback) {
      const user = cacheUsers.find((u) => u._id === userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User session profile not found in memory.",
        });
      }

      const { password: _, ...userToSend } = user;
      return res.status(200).json({
        success: true,
        data: userToSend,
        databaseMode: "fallback-memory",
      });
    }

    // MongoDB Mode Path
    const user = await (UserDefault as any).findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Standard user record not located in MongoDB profile collection.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
      databaseMode: "mongodb",
    });
  } catch (err: any) {
    console.error("getProfile endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "Exception locating health profile attributes.",
      details: err.message,
    });
  }
}

/**
 * POST /save-bmi
 * Places a standalone historical measurement event linked to the active account
 */
export async function saveBmi(req: Request, res: Response) {
  try {
    const userId = req.headers["x-user-id"] || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Active credentials mapping x-user-id missing from request headers.",
      });
    }

    const { weight, height } = req.body;

    if (!weight || !height) {
      return res.status(400).json({
        success: false,
        error: "Please supply weight (kg) and height (cm) values to complete recording.",
      });
    }

    const parsedWeight = parseFloat(weight);
    const parsedHeight = parseFloat(height);
    const bmiValue = calculateBmiValue(parsedWeight, parsedHeight);
    const bmiCategory = classifyBmiValue(bmiValue) as any;

    const isFallback = getDbMode() === "fallback-memory";

    const newRecord = {
      userId: String(userId),
      weight: parsedWeight,
      height: parsedHeight,
      bmiValue,
      bmiCategory,
    };

    if (isFallback) {
      const memoryRecord = {
        _id: `mem_log_${Date.now()}`,
        ...newRecord,
        recordedAt: new Date().toISOString(),
      };
      cacheBmiRecords.push(memoryRecord);

      // Sync user profile master metrics in memory
      const userIdx = cacheUsers.findIndex((u) => u._id === userId);
      if (userIdx !== -1) {
        cacheUsers[userIdx].weight = parsedWeight;
        cacheUsers[userIdx].height = parsedHeight;
        cacheUsers[userIdx].bmiCategory = bmiCategory;
        cacheUsers[userIdx].updatedAt = new Date().toISOString();
      }

      return res.status(200).json({
        success: true,
        message: "Dynamic wellness measurement registered (In-Memory mode)",
        data: memoryRecord,
        databaseMode: "fallback-memory",
      });
    }

    // Live MongoDB path
    const mdbLog = new BMIRecordDefault(newRecord);
    await mdbLog.save();

    // Synchronously update the master table profile variables
    const activeUser = await (UserDefault as any).findById(userId);
    if (activeUser) {
      activeUser.weight = parsedWeight;
      activeUser.height = parsedHeight;
      activeUser.bmiCategory = bmiCategory;
      await activeUser.save();
    }

    return res.status(200).json({
      success: true,
      message: "Dynamic wellness entry registered in MongoDB",
      data: mdbLog,
      databaseMode: "mongodb",
    });
  } catch (err: any) {
    console.error("saveBmi endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "Database exception logging individual BMI record.",
      details: err.message,
    });
  }
}

/**
 * GET /bmi-history
 * Returns the history list of BMI records filtered strictly to the logged-in user
 */
export async function getBmiHistory(req: Request, res: Response) {
  try {
    const userId = req.headers["x-user-id"] || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthenticated request. Active credentials mapping x-user-id missing.",
      });
    }

    const isFallback = getDbMode() === "fallback-memory";

    if (isFallback) {
      // Filter strictly by registered user ID
      const records = cacheBmiRecords
        .filter((r) => r.userId === String(userId))
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

      return res.status(200).json({
        success: true,
        data: records,
        databaseMode: "fallback-memory",
        connectionError: getLastError(),
      });
    }

    // Live MongoDB path
    const history = await BMIRecordDefault.find({ userId: String(userId) } as any).sort({
      recordedAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: history,
      databaseMode: "mongodb",
    });
  } catch (err: any) {
    console.error("getBmiHistory endpoint error:", err);
    return res.status(500).json({
      success: false,
      error: "Exception locating database history logs.",
      details: err.message,
    });
  }
}

/**
 * POST /food-search
 * Searches for a food item using Gemini API (real food nutrition lookup)
 * Falls back to local database matching in case of API failure or missing keys
 */
export async function searchFood(req: Request, res: Response) {
  try {
    const { query } = req.body;
    const cleanQuery = String(query || "").toLowerCase().trim();

    if (!cleanQuery) {
      return res.status(200).json({
        success: true,
        source: "local-empty",
        data: FOODS_DATABASE.slice(0, 12)
      });
    }

    // Attempt local absolute prefix matches first for extreme responsiveness
    const exactLocalMatches = FOODS_DATABASE.filter(f => 
      f.name.toLowerCase() === cleanQuery || 
      f.id.toLowerCase() === cleanQuery
    );
    if (exactLocalMatches.length > 0) {
      return res.status(200).json({
        success: true,
        source: "local-exact",
        data: exactLocalMatches
      });
    }

    const hasApiKey = !!process.env.GEMINI_API_KEY;

    if (hasApiKey) {
      try {
        const ai = getGeminiClient();
        const prompt = `Act as an expert food nutrition biochemist. The user is searching for: "${cleanQuery}".
Generate a list of exactly 1 to 4 highly realistic matching real-world food items, ingredients, local foods, or dishes (e.g. if query is "burg" or similar, map to "Burger"; if it is a local dish name like "biryani", provide "Chicken Biryani" etc.).
Return a structured JSON list complying strictly with standard food intelligence schemas.

Each item in the list must be fully customized with realistic calories, macronutrients (carbs, protein, fat in grams), serving sizes, helpful descriptions, and realistic fitness burn times based on calories:
- Walking: around (calories / 3.5) minutes
- Running: around (calories / 7.7) minutes
- Cardio: around (calories / 9.0) minutes

Also, decide a Base Recommendation category:
- Use "Can Eat" for nutrient-dense healthy organic whole foods.
- Use "Occasional" for balanced meals containing moderate carbs/fats/oils.
- Use "Avoid" for highly processed, fried junk food, high-sodium snacks, or heavy sugarcane syrups.

Use realistic, high-resolution, food-focused Unsplash image photography URLs for the "image" field.
Choose from existing high-quality general food photo patterns or similar valid, premium public domain images like:
- Salad/Healthy/Veggies/Salmon/Eggs: https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80
- Fast Food/Pizza/Burger/Chips: https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80
- Rice/Biryani/Curry: https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=80
- Drinks/Soda/Juice/Tea: https://images.unsplash.com/photo-1534050359345-422179b50d3a?w=500&auto=format&fit=crop&q=80`;

        const response = await callGeminiWithRetry(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Kebab-case lowercase unique ID" },
                  name: { type: Type.STRING },
                  category: { type: Type.STRING, description: "Must be 'Indian Foods', 'Fast Food', 'Healthy', or 'Snacks & Drinks'" },
                  calories: { type: Type.INTEGER },
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      carbs: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      fat: { type: Type.NUMBER }
                    },
                    required: ["carbs", "protein", "fat"]
                  },
                  image: { type: Type.STRING },
                  description: { type: Type.STRING },
                  baseRecommendation: { type: Type.STRING, description: "Must be 'Can Eat', 'Occasional', or 'Avoid'" },
                  servingSize: { type: Type.STRING },
                  burnMetrics: {
                    type: Type.OBJECT,
                    properties: {
                      walking: { type: Type.INTEGER },
                      running: { type: Type.INTEGER },
                      cardio: { type: Type.INTEGER }
                    },
                    required: ["walking", "running", "cardio"]
                  }
                },
                required: [
                  "id", "name", "category", "calories", "macros", "image",
                  "description", "baseRecommendation", "servingSize", "burnMetrics"
                ]
              }
            }
          }
        });

        const textOutput = response.text?.trim() || "";
        if (textOutput) {
          const parsedFoods = JSON.parse(textOutput);
          if (Array.isArray(parsedFoods) && parsedFoods.length > 0) {
            return res.status(200).json({
              success: true,
              source: "gemini-api",
              data: parsedFoods
            });
          }
        }
      } catch (geminiErr: any) {
        console.error("Gemini API call or response parsing failed, falling back to local database:", geminiErr);
      }
    }

    // Local Fallback Filter matching search
    // Handles flexible spelling approx such as matching "pizz" to Pizza, "nood" to noodles
    const filteredLocal = FOODS_DATABASE.filter(f => 
      f.name.toLowerCase().includes(cleanQuery) ||
      f.category.toLowerCase().includes(cleanQuery) ||
      f.description.toLowerCase().includes(cleanQuery)
    );

    if (filteredLocal.length > 0) {
      return res.status(200).json({
        success: true,
        source: "local-fallback",
        data: filteredLocal
      });
    }

    // Levenshtein approximation suggestions or simple heuristics if query yields nothing
    const queryLetters = new Set(cleanQuery.split(''));
    const matchesByLeniency = FOODS_DATABASE.map(food => {
      let score = 0;
      const foodName = food.name.toLowerCase();
      if (foodName.includes(cleanQuery) || cleanQuery.includes(foodName)) {
        score += 15;
      }
      let letterMatches = 0;
      for (const char of foodName) {
        if (queryLetters.has(char)) letterMatches++;
      }
      score += (letterMatches / Math.max(1, cleanQuery.length)) * 5;
      return { food, score };
    })
    .filter(item => item.score > 2)
    .sort((a, b) => b.score - a.score)
    .map(item => item.food)
    .slice(0, 5);

    return res.status(200).json({
      success: true,
      source: matchesByLeniency.length > 0 ? "local-fuzzy" : "local-all",
      data: matchesByLeniency.length > 0 ? matchesByLeniency : FOODS_DATABASE.slice(0, 10)
    });

  } catch (err: any) {
    console.error("searchFood generic controller error:", err);
    return res.status(500).json({
      success: false,
      error: "Nutrition search query failed.",
      data: FOODS_DATABASE.slice(0, 10),
      details: err.message
    });
  }
}
