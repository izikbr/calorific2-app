import React, { useState } from 'react';
import { UserProfile, Gender, ActivityLevel, Goal } from '../types';
import Card from './common/Card';

interface OnboardingProps {
  onComplete: (profile: Omit<UserProfile, 'id'>) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Omit<UserProfile, 'id'>>>({
    gender: Gender.Male,
    activityLevel: ActivityLevel.Medium,
    goal: Goal.Maintain,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['age', 'height', 'weight', 'targetWeight'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumericField ? Number(value) : value }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData as Omit<UserProfile, 'id'>);
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">פרטים אישיים</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">שם / כינוי</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">מין</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                  <option value={Gender.Male}>זכר</option>
                  <option value={Gender.Female}>נקבה</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">גיל</label>
                <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">נתונים פיזיים</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">גובה (ס"מ)</label>
                <input type="number" name="height" value={formData.height || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">משקל נוכחי (ק"ג)</label>
                <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">משקל יעד (ק"ג)</label>
                <input type="number" name="targetWeight" value={formData.targetWeight || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-slate-700">מטרות ופעילות</h2>
            <div className="space-y-4">
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
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <Card>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-center mb-2">ברוכים הבאים לקלוריק!</h1>
        <p className="text-center text-slate-500 mb-6">בואו נבנה לכם תוכנית תזונה מותאמת אישית.</p>
        
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
            <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {renderStep()}
          <div className="mt-8 flex justify-between">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition">
                הקודם
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={nextStep} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition ms-auto">
                הבא
              </button>
            ) : (
              <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition ms-auto">
                סיום
              </button>
            )}
          </div>
        </form>
      </div>
    </Card>
  );
};

export default Onboarding;
