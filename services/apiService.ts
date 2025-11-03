// FIX: Implemented Gemini API service functions to resolve module not found errors.
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem } from '../types';

// Helper function to convert a File object to a base64 string
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const getFoodFromImage = async (ai: GoogleGenAI, imageFile: File): Promise<Omit<FoodItem, 'id'>[]> => {
  try {
    const imagePart = await fileToGenerativePart(imageFile);
    
    const prompt = `
      Analyze the image and identify all distinct food items present.
      For each item, provide an estimated nutritional breakdown (calories, protein, carbs, fat).
      Return the data as a JSON array of objects. Each object should represent a food item and have the following properties: "name" (string), "calories" (number), "protein" (number), "carbs" (number), "fat" (number).
      If no food is identifiable, return an empty array.
      Provide the name in Hebrew.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
            required: ['name', 'calories', 'protein', 'carbs', 'fat'],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (Array.isArray(parsedResponse)) {
       return parsedResponse.map(item => ({
        ...item,
        timestamp: new Date().toISOString()
       }));
    }
    return [];

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
};


export const getNutritionInfoFromText = async (ai: GoogleGenAI, query: string): Promise<Omit<FoodItem, 'id'> | null> => {
  try {
    const prompt = `
      Analyze the following food description: "${query}".
      Provide an estimated nutritional breakdown for the entire meal described (calories, protein, carbs, fat).
      Return the data as a single JSON object with the following properties: "name" (string, summarizing the meal in Hebrew), "calories" (number), "protein" (number), "carbs" (number), "fat" (number).
      If you cannot determine the nutritional information from the query, the values should be 0.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
          },
          required: ['name', 'calories', 'protein', 'carbs', 'fat'],
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) return null;

    const parsedResponse = JSON.parse(jsonText);
    
    if (parsedResponse && typeof parsedResponse === 'object' && 'name' in parsedResponse && parsedResponse.calories > 0) {
       return {
        ...parsedResponse,
        timestamp: new Date().toISOString()
       };
    }
    return null;

  } catch (error) {
    console.error("Error getting nutrition info from text with Gemini:", error);
    throw error;
  }
};