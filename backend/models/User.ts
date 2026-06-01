import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: "sedentary" | "moderate" | "active";
  bmiCategory?: "Underweight" | "Healthy" | "Overweight" | "Obesity";
  createdAt: Date;
  updatedAt: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    height: {
      type: Number,
      min: 30,
      max: 300,
    },
    weight: {
      type: Number,
      min: 2,
      max: 600,
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "moderate", "active"],
    },
    bmiCategory: {
      type: String,
      enum: ["Underweight", "Healthy", "Overweight", "Obesity"],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password before storing
UserSchema.pre("save", async function (this: any, next: any) {
  const user = this;
  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password helper helper method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password || "");
  } catch (err) {
    return false;
  }
};

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
