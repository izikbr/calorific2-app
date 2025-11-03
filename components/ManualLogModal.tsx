import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FoodItem } from '../types';
import Card from './common/Card';
import Spinner from './common/Spinner';
import { getNutritionInfoFromText } from '../services/apiService';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Updated prop type to match the data structure from apiService.
  onLog: (items: Omit<FoodItem, 'id'>[]) => void;
  ai: GoogleGenAI;
}

// FIX: Implemented the ManualLogModal component for analyzing food from text input.
const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, onLog, ai }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setQuery('');
    setError(null);
    setIsLoading(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!query.trim()) {
      setError("Please describe what you ate.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const foodItem = await getNutritionInfoFromText(ai, query);
      if (foodItem) {
        onLog([foodItem]);
        handleClose();
      } else {
        setError("Could not get nutritional information for that description. Please be more specific.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while getting nutrition information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">הוספה ידנית</h2>
            <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
          </div>
          
          <div className="space-y-4">
            <label htmlFor="food-query" className="block text-sm font-medium text-slate-600">מה אכלת?</label>
            <textarea
              id="food-query"
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="לדוגמה: 2 ביצים מקושקשות, פרוסת לחם מלא עם אבוקדו וסלט ירקות קטן בצד"
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition">
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
              >
                {isLoading ? <Spinner /> : 'הוסף ליומן'}
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ManualLogModal;