// FIX: Implemented the core TypeScript types and enums.
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

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string; // ISO string
}

export interface UserProfile {
  id: string;
  name: string;
  avatar?: string;
  age: number;
  gender: Gender;
  height: number; // in cm
  weight: number; // in kg
  targetWeight: number; // in kg
  activityLevel: ActivityLevel;
  goal: Goal;
  loseWeightWeeks?: number;
  foodLog?: FoodItem[];
}
