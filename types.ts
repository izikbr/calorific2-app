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
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface NutritionGoals {
    tdee: number;
    bmi: number;
    protein: number;
    carbs: number;
    fat: number;
}

export type ModalType = 'image' | 'manual' | 'appleHealthInfo' | null;