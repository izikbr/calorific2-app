import React, { useState, useEffect } from 'react';
import { FoodItem } from '../types';
import Card from './common/Card';

interface UpdateTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedFoodItem: FoodItem) => void;
  onDelete: (foodItemId: string) => void;
  foodItem: FoodItem;
}

// FIX: Implemented the UpdateTimelineModal to allow editing or deleting food log entries.
const UpdateTimelineModal: React.FC<UpdateTimelineModalProps> = ({ isOpen, onClose, onUpdate, onDelete, foodItem }) => {
  const [formData, setFormData] = useState<FoodItem>(foodItem);

  useEffect(() => {
    if (isOpen) {
      setFormData(foodItem);
    }
  }, [foodItem, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'name' ? value : Number(value) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };
  
  const handleDelete = () => {
    if (window.confirm(`האם למחוק את "${foodItem.name}"?`)) {
      onDelete(foodItem.id);
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">עריכת פריט</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">שם הפריט</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">קלוריות</label>
                  <input type="number" name="calories" value={formData.calories} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="0" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">חלבון (ג')</label>
                  <input type="number" name="protein" value={formData.protein} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="0" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">פחמימות (ג')</label>
                  <input type="number" name="carbs" value={formData.carbs} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="0" />
                </div>
                 <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">שומן (ג')</label>
                  <input type="number" name="fat" value={formData.fat} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="0" />
                </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
               <button type="button" onClick={handleDelete} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition text-sm">
                מחק פריט
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition">
                  ביטול
                </button>
                <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                  שמור שינויים
                </button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default UpdateTimelineModal;
