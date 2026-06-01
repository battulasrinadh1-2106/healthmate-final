/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Gender = 'male' | 'female' | 'other';

export type ActivityLevel = 'sedentary' | 'moderate' | 'active';

export type BMIClassification = 'Underweight' | 'Healthy' | 'Overweight' | 'Obesity';

export interface UserProfile {
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  activityLevel: ActivityLevel;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  macros: {
    carbs: number;   // in g
    protein: number; // in g
    fat: number;     // in g
  };
  image: string;     // URL or placeholder from unsplash based on skill guidelines
  description: string;
  baseRecommendation: 'Can Eat' | 'Occasional' | 'Avoid';
  servingSize: string;
  burnMetrics: {
    walking: number; // minutes
    running: number; // minutes
    cardio: number;  // minutes
  };
}

export interface PersonalizedAdvice {
  verdict: 'Can Eat' | 'Occasional' | 'Limit / Avoid';
  colorClass: string; // Tailwind bg-colour
  textColorClass: string;
  badgeColorClass: string;
  warningText: string;
  intakeGuidance: string;
  suggestedWorkout: string;
  workoutDuration: number;
  workoutIcon: string;
}
