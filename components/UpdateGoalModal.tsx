import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityLevel, Goal } from '../types';
import Card from './common/Card';

interface UpdateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProfile: Partial<UserProfile>) => void;
  userProfile: UserProfile;
}

const UpdateGoalModal: React.FC<UpdateGoalModalProps> = ({ isOpen, onClose, onUpdate, userProfile }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>(userProfile);

  useEffect(() => {
    if (isOpen) {
      setFormData(userProfile);
    }
  }, [userProfile, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['weight', 'targetWeight', 'loseWeightWeeks', 'height', 'age'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumericField ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">עדכון פרטים ויעדים</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">משקל נוכחי (ק"ג)</label>
              <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">משקל יעד (ק"ג)</label>
              <input type="number" name="targetWeight" value={formData.targetWeight || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">רמת פעילות גופנית</label>
              <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value={ActivityLevel.Low}>נמוכה (עבודה משרדית)</option>
                <option value={ActivityLevel.Medium}>בינונית (1-3 אימונים בשבוע)</option>
                <option value={ActivityLevel.High}>גבוהה (4-6 אימונים בשבוע)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">המטרה שלי</label>
              <select name="goal" value={formData.goal} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value={Goal.Lose}>ירידה במשקל</option>
                <option value={Goal.Maintain}>שמירה על המשקל</option>
                <option value={Goal.Gain}>עלייה במסה</option>
              </select>
            </div>
            {formData.goal === Goal.Lose && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">בכמה שבועות תרצה להגיע למשקל היעד?</label>
                <input type="number" name="loseWeightWeeks" value={formData.loseWeightWeeks || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition">
                ביטול
              </button>
              <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                שמור שינויים
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default UpdateGoalModal;
