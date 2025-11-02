
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FoodItem } from '../types';
import { getFoodFromImage } from '../services/apiService';
import Spinner from './common/Spinner';

interface ImageLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (items: FoodItem[]) => void;
  ai: GoogleGenAI;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ImageLogModal: React.FC<ImageLogModalProps> = ({ isOpen, onClose, onAddFood, ai, isLoading, setIsLoading }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setAnalyzedItems([]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const items = await getFoodFromImage(ai, selectedFile);
      if(items.length === 0){
        setError("לא הצלחנו לזהות פריטי מזון בתמונה. נסו תמונה ברורה יותר.");
      }
      setAnalyzedItems(items);
    } catch (err) {
      setError('אירעה שגיאה בניתוח התמונה.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddItem = (index: number) => {
    onAddFood([analyzedItems[index]]);
    setAnalyzedItems(prev => prev.filter((_, i) => i !== index));
  }
  
  const handleAddAll = () => {
    onAddFood(analyzedItems);
    resetState();
  }

  const resetState = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setAnalyzedItems([]);
    setError(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  }
  
  const handleClose = () => {
    resetState();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">זיהוי ארוחה מתמונה</h2>
            <button onClick={handleClose} className="text-slate-500 hover:text-slate-800">&times;</button>
          </div>
          <div className="space-y-4">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" ref={fileInputRef}/>
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-primary-500 hover:text-primary-500 transition">
              {imagePreview ? 'שנה תמונה' : 'בחר תמונה'}
            </button>
            
            {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded-lg"/>}
            
            {selectedFile && analyzedItems.length === 0 && (
              <button onClick={handleAnalyze} disabled={isLoading} className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 flex justify-center items-center">
                {isLoading ? <Spinner/> : 'נתח תמונה'}
              </button>
            )}

            {error && <p className="text-red-500 text-center">{error}</p>}
            
            {analyzedItems.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">פריטים שזוהו:</h3>
                <ul className="space-y-2">
                  {analyzedItems.map((item, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-slate-100 rounded-md">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-slate-600">{item.calories.toFixed(0)} קל', {item.protein.toFixed(0)}ח, {item.carbs.toFixed(0)}פ, {item.fat.toFixed(0)}ש</p>
                      </div>
                      <button onClick={() => handleAddItem(index)} className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">הוסף</button>
                    </li>
                  ))}
                </ul>
                <button onClick={handleAddAll} className="w-full mt-4 p-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">הוסף הכל וסגור</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageLogModal;
