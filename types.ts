export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum ActivityLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum Goal {
  Lose = 'lose',
  Maintain = 'maintain',
  Gain = 'gain',
}

export interface UserProfile {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  avatar?: string;
  loseWeightWeeks?: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface NutritionGoals {
    tdee: number;
    bmi: number;
    protein: number;
    carbs: number;
    fat: number;
}

export type ModalType = 'image' | 'manual' | null;