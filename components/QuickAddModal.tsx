import React, { useState, useMemo } from 'react';
import { FoodItem } from '../types';
import Card from './common/Card';
import { commonFoods } from '../data/commonFoods';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLog: (items: Omit<FoodItem, 'id' | 'timestamp'>[]) => void;
}

type CommonFood = Omit<FoodItem, 'id' | 'timestamp'>;

const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<CommonFood[]>([]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return commonFoods.filter(food =>
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10); // Limit results for performance
  }, [searchTerm]);

  const handleAddItem = (item: CommonFood) => {
    setSelectedItems(prev => [...prev, item]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleLogAndClose = () => {
    if (selectedItems.length > 0) {
      onLog(selectedItems);
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedItems([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg h-[70vh] flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">הוספה מהירה</h2>
            <button onClick={handleClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש פריט מזון (למשל: 'תפוח')"
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            autoFocus
          />
        </div>
        
        <div className="flex-grow overflow-y-auto p-6">
            {searchResults.length > 0 ? (
                <ul className="space-y-2">
                    {searchResults.map((item, index) => (
                        <li key={index} onClick={() => handleAddItem(item)} className="p-3 bg-slate-50 rounded-md flex justify-between items-center cursor-pointer hover:bg-primary-100 transition">
                            <div>
                                <p className="font-semibold text-slate-700">{item.name}</p>
                                <p className="text-sm text-slate-500">{Math.round(item.calories)} קלוריות</p>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        </li>
                    ))}
                </ul>
            ) : (
                searchTerm && <p className="text-center text-slate-500">לא נמצאו תוצאות.</p>
            )}

            {selectedItems.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-semibold text-slate-700 mb-2 border-t pt-4">פריטים שנבחרו:</h3>
                    <ul className="space-y-2">
                         {selectedItems.map((item, index) => (
                             <li key={index} className="p-2 bg-green-50 rounded-md flex justify-between items-center">
                                 <p className="text-green-800">{item.name}</p>
                                 <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                 </button>
                             </li>
                         ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="p-6 mt-auto border-t border-slate-200">
             <div className="flex justify-end gap-3">
              <button type="button" onClick={handleClose} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition">
                ביטול
              </button>
              <button
                type="button"
                onClick={handleLogAndClose}
                disabled={selectedItems.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                הוסף {selectedItems.length > 0 ? `(${selectedItems.length})` : ''} ליומן
              </button>
            </div>
        </div>

      </Card>
    </div>
  );
};

export default QuickAddModal;
