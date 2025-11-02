import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';
import { UserProfile, Gender, NutritionGoals, FoodItem } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';

export const calculateNutritionGoals = (profile: UserProfile): NutritionGoals => {
  const { gender, weight, height, age, activityLevel, goal } = profile;

  // Calculate BMR using Mifflin-St Jeor
  let bmr: number;
  if (gender === Gender.Male) {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityFactor = ACTIVITY_FACTORS[activityLevel];
  const maintenanceCalories = bmr * activityFactor;
  const goalAdjustment = GOAL_ADJUSTMENTS[goal];
  const tdee = Math.round(maintenanceCalories + goalAdjustment);

  // Calculate BMI
  const heightInMeters = height / 100;
  const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  
  // Calculate Macros (40% carbs, 30% protein, 30% fat)
  const protein = Math.round((tdee * 0.30) / 4);
  const carbs = Math.round((tdee * 0.40) / 4);
  const fat = Math.round((tdee * 0.30) / 9);


  return { tdee, bmi, protein, carbs, fat };
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const getFoodFromImage = async (ai: GoogleGenAI, imageFile: File): Promise<FoodItem[]> => {
    const base64Image = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            mimeType: imageFile.type,
            data: base64Image,
        },
    };
    const textPart = {
        text: `אתה תזונאי מומחה. נתח את תמונת הארוחה הזו. זהה כל פריט מזון והערך את משקלו בגרמים. ספק את הערכת הקלוריות, חלבון (בגרמים), פחמימות (בגרמים), ושומן (בגרמים) עבור כל פריט. הגב רק עם אובייקט JSON המכיל מפתח יחיד 'items' שהוא מערך של אובייקטי מזון. כל אובייקט חייב להכיל את המפתחות הבאים: 'name' (בעברית), 'calories' (מספר), 'protein' (מספר), 'carbs' (מספר), 'fat' (מספר). אל תכלול טקסט מקדים או הסברים.`
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          // FIX: Add responseSchema to ensure structured JSON output from the model.
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                  },
                }
              }
            },
          }
        }
    });

    try {
        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        if (result.items && Array.isArray(result.items)) {
            return result.items.map((item: any) => ({
                ...item,
                timestamp: new Date().toISOString()
            }));
        }
    } catch (e) {
        console.error("Error parsing Gemini response:", e);
    }
    return [];
};

export const getNutritionInfoFromText = async (ai: GoogleGenAI, query: string): Promise<FoodItem | null> => {
  const prompt = `אתה מסד נתונים תזונתי. עבור פריט המזון "${query}", ספק את המידע התזונתי שלו. הגב רק עם אובייקט JSON עם המפתחות הבאים: 'name' (בעברית), 'calories' (מספר), 'protein' (מספר), 'carbs' (מספר), 'fat' (מספר). אם אינך מוצא את הפריט, החזר אובייקט עם כל הערכים כאפס.`

  const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // FIX: Add responseSchema to ensure structured JSON output from the model.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
        }
      }
  });

  try {
      const jsonString = response.text.trim();
      const result = JSON.parse(jsonString);
      if (result.calories > 0) {
        return {
          ...result,
          timestamp: new Date().toISOString()
        }
      }
  } catch (e) {
      console.error("Error parsing Gemini response:", e);
  }
  return null;
};
