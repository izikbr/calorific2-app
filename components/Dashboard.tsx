// FIX: Implemented the Dashboard component to display user-specific nutritional information.
import React, { useMemo } from 'react';
import { UserProfile, FoodItem, NutritionGoals, ModalType, Gender } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';
import Card from './common/Card';

interface DashboardProps {
  userProfile: UserProfile;
  foodLog: FoodItem[];
  onAddFood: (items: FoodItem[] | FoodItem) => void;
  onRemoveFood: (timestamp: string) => void;
  setModal: (type: ModalType) => void;
}

const calculateNutritionGoals = (profile: UserProfile): NutritionGoals => {
  // Mifflin-St Jeor Equation for BMR
  const bmr =
    profile.gender === Gender.Male
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;

  const tdee = bmr * ACTIVITY_FACTORS[profile.activityLevel];
  const calorieGoal = tdee + GOAL_ADJUSTMENTS[profile.goal];

  // Macronutrient split: 40% Carbs, 30% Protein, 30% Fat
  const proteinGoal = (calorieGoal * 0.3) / 4; // 4 kcal per gram
  const carbsGoal = (calorieGoal * 0.4) / 4;   // 4 kcal per gram
  const fatGoal = (calorieGoal * 0.3) / 9;     // 9 kcal per gram
  
  const bmi = profile.weight / ((profile.height / 100) ** 2);

  return { tdee: calorieGoal, bmi, protein: proteinGoal, carbs: carbsGoal, fat: fatGoal };
};

const NutritionSummary: React.FC<{ goals: NutritionGoals; consumed: Omit<FoodItem, 'name' | 'timestamp'> }> = ({ goals, consumed }) => {
    const stats = [
        { label: 'קלוריות', consumed: consumed.calories, goal: goals.tdee, unit: '' },
        { label: 'חלבון', consumed: consumed.protein, goal: goals.protein, unit: 'ג' },
        { label: 'פחמימות', consumed: consumed.carbs, goal: goals.carbs, unit: 'ג' },
        { label: 'שומן', consumed: consumed.fat, goal: goals.fat, unit: 'ג' },
    ];
    
    return (
        <Card>
            <div className="p-4">
                <h2 className="text-lg font-semibold text-slate-700 mb-4">סיכום יומי</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map(stat => {
                        const progress = stat.goal > 0 ? (stat.consumed / stat.goal) * 100 : 0;
                        return (
                            <div key={stat.label} className="flex flex-col items-center text-center">
                                <div className="relative w-24 h-24">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="#e2e8f0"
                                            strokeWidth="3"
                                        />
                                        <path
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke={progress > 100 ? '#ef4444' : '#10b981'}
                                            strokeWidth="3"
                                            strokeDasharray={`${progress > 100 ? 100 : progress}, 100`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 18 18)"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                         <span className="text-xl font-bold text-slate-800">{stat.consumed.toFixed(0)}</span>
                                         <span className="text-xs text-slate-500">/{stat.goal.toFixed(0)}{stat.unit}</span>
                                    </div>
                                </div>
                                <span className="mt-2 text-sm font-medium text-slate-600">{stat.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Card>
    );
};

const FoodLog: React.FC<{ items: FoodItem[]; onRemove: (timestamp: string) => void }> = ({ items, onRemove }) => (
    <Card>
        <div className="p-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">יומן אכילה</h2>
            {items.length === 0 ? (
                <p className="text-slate-500 text-center py-4">היומן שלך ריק. הוסף פריטים כדי להתחיל!</p>
            ) : (
                <ul className="space-y-3">
                    {items.map(item => (
                        <li key={item.timestamp} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                           <div>
                             <p className="font-semibold text-slate-800">{item.name}</p>
                             <p className="text-sm text-slate-500">
                                 {item.calories.toFixed(0)} קל' • ח: {item.protein.toFixed(0)} • פ: {item.carbs.toFixed(0)} • ש: {item.fat.toFixed(0)}
                             </p>
                           </div>
                           <button onClick={() => onRemove(item.timestamp)} className="text-slate-400 hover:text-red-500 transition">
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                           </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    </Card>
);

const Integrations: React.FC<{ setModal: (type: ModalType) => void }> = ({ setModal }) => (
    <Card>
        <div className="p-4">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">חיבור לשירותים חיצוניים</h2>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M12.22 5.82a.5.5 0 0 1 .36.87l-2.65 4.52a.5.5 0 0 1-.87-.51l2.65-4.52a.5.5 0 0 1 .51-.36z"/><path d="M15.25 8.5a.5.5 0 0 1 .52.84l-3.53 4.2a.5.5 0 0 1-.84-.53l3.53-4.2a.5.5 0 0 1 .32-.31z"/><path d="M18.5 11a.5.5 0 0 1 .53.81l-4.56 3.9a.5.5 0 0 1-.81-.54l4.56-3.9a.5.5 0 0 1 .28-.23z"/><path d="M6.5 12.5a.5.5 0 0 1 .52-.84l4.18 3.53a.5.5 0 0 1-.53.84l-4.18-3.53a.5.5 0 0 1-.01-1z"/><path d="M20.8 13.7a.5.5 0 0 1 .58.75l-5.65 3.43a.5.5 0 0 1-.75-.58l5.65-3.43a.5.5 0 0 1 .17-.17z"/><path d="M12 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10c0 2.22-.72 4.26-1.91 5.92"/></svg>
                    <p className="font-semibold text-slate-800">Apple Health</p>
                </div>
                <button onClick={() => setModal('appleHealthInfo')} className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-300 transition">
                    התחבר
                </button>
            </div>
        </div>
    </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ userProfile, foodLog, onAddFood, onRemoveFood, setModal }) => {
  const nutritionGoals = useMemo(() => calculateNutritionGoals(userProfile), [userProfile]);

  const consumedTotals = useMemo(() => {
    return foodLog.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [foodLog]);

  return (
    <div className="space-y-6">
       <NutritionSummary goals={nutritionGoals} consumed={consumedTotals} />
       
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => setModal('image')} className="flex items-center justify-center gap-3 p-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                 הוספה מתמונה
            </button>
            <button onClick={() => setModal('manual')} className="flex items-center justify-center gap-3 p-4 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                הוספה ידנית
            </button>
       </div>
       
       <Integrations setModal={setModal} />

       <FoodLog items={foodLog} onRemove={onRemoveFood} />
    </div>
  );
};

export default Dashboard;