
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FoodItem } from '../types';
import { getNutritionInfoFromText } from '../services/apiService';
import Spinner from './common/Spinner';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (item: FoodItem) => void;
  ai: GoogleGenAI;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, onAddFood, ai, isLoading, setIsLoading }) => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    try {
      const result = await getNutritionInfoFromText(ai, query);
      if (result) {
        setSearchResult(result);
      } else {
        setError('לא נמצאו נתונים עבור המנה שהזנת.');
      }
    } catch (err) {
      setError('אירעה שגיאה בחיפוש.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdd = () => {
    if(searchResult) {
      onAddFood(searchResult);
      resetState();
    }
  }

  const resetState = () => {
    setQuery('');
    setSearchResult(null);
    setError(null);
  }

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">הוספה ידנית</h2>
            <button onClick={handleClose} className="text-slate-500 hover:text-slate-800">&times;</button>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="לדוגמה: פיתה עם טחינה ו-2 קציצות"
              className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-slate-400">
              חפש
            </button>
          </form>

          <div className="mt-4 min-h-[100px] flex items-center justify-center">
            {isLoading && <Spinner />}
            {error && <p className="text-red-500">{error}</p>}
            {searchResult && (
              <div className="w-full p-4 bg-slate-100 rounded-lg text-center">
                <p className="font-bold text-lg">{searchResult.name}</p>
                <p className="text-slate-600">
                  {searchResult.calories.toFixed(0)} קל' | 
                  ח: {searchResult.protein.toFixed(0)}g |
                  פ: {searchResult.carbs.toFixed(0)}g |
                  ש: {searchResult.fat.toFixed(0)}g
                </p>
                <button onClick={handleAdd} className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                  הוסף ליומן
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualLogModal;
