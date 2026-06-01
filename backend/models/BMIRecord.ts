import mongoose, { Schema, Document } from "mongoose";

export interface IBMIRecord extends Document {
  userId: string;
  weight: number;
  height: number;
  bmiValue: number;
  bmiCategory: "Underweight" | "Healthy" | "Overweight" | "Obesity";
  recordedAt: Date;
}

const BMIRecordSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  bmiValue: {
    type: Number,
    required: true,
  },
  bmiCategory: {
    type: String,
    required: true,
    enum: ["Underweight", "Healthy", "Overweight", "Obesity"],
  },
  recordedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.BMIRecord || mongoose.model<IBMIRecord>("BMIRecord", BMIRecordSchema);
