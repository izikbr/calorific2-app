// FIX: Define and export all application-specific types to resolve module errors.
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
  avatar?: string;
  gender: Gender;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  loseWeightWeeks?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}
