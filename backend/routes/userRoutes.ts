import express from "express";
import { 
  signup,
  login,
  createProfile, 
  getProfile, 
  saveBmi, 
  getBmiHistory,
  searchFood
} from "../controllers/userController.ts";

const router = express.Router();

// Authentication APIs
router.post("/signup", signup);
router.post("/login", login);

// Profile and health data APIs (per user)
router.post("/create-profile", createProfile);
router.get("/get-profile", getProfile);
router.post("/save-bmi", saveBmi);
router.get("/bmi-history", getBmiHistory);

// Universal Real Food Nutrition Lookup API
router.post("/food-search", searchFood);

export default router;
