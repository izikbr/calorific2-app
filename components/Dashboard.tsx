import React from 'react';
// FIX: Implement the Dashboard component to display user data and daily progress.
import { UserProfile, FoodItem } from '../types';
import Card from './common/Card';

interface DashboardProps {
  userProfile: UserProfile;
  foodLog: FoodItem[];
  dailyCalorieGoal: number;
  onOpenManualLog: () => void;
  onOpenImageLog: () => void;
  onOpenUpdateGoal: () => void;
  onOpenUpdateProfile: () => void;
  onOpenUpdateTimeline: (item: FoodItem) => void;
  onOpenAppleHealthInfo: () => void;
}

const StatCard: React.FC<{ label: string; value: number | string; unit?: string; className?: string }> = ({ label, value, unit, className = '' }) => (
    <div className={`text-center ${className}`}>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}{unit && ` (${unit})`}</p>
    </div>
);

const MacroProgressBar: React.FC<{ label: string; value: number; goal: number; color: string }> = ({ label, value, goal, color }) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="text-sm text-slate-500">{Math.round(value)} / {Math.round(goal)}g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ 
    userProfile, 
    foodLog,
    dailyCalorieGoal,
    onOpenManualLog, 
    onOpenImageLog,
    onOpenUpdateGoal,
    onOpenUpdateProfile,
    onOpenUpdateTimeline,
    onOpenAppleHealthInfo,
}) => {
    const consumedCalories = foodLog.reduce((acc, item) => acc + item.calories, 0);
    const consumedProtein = foodLog.reduce((acc, item) => acc + item.protein, 0);
    const consumedCarbs = foodLog.reduce((acc, item) => acc + item.carbs, 0);
    const consumedFat = foodLog.reduce((acc, item) => acc + item.fat, 0);
    
    const remainingCalories = dailyCalorieGoal - consumedCalories;
    const calorieProgress = dailyCalorieGoal > 0 ? (consumedCalories / dailyCalorieGoal) * 100 : 0;
    
    // Recommended macros (e.g., 40% carbs, 30% protein, 30% fat)
    const proteinGoal = (dailyCalorieGoal * 0.30) / 4;
    const carbsGoal = (dailyCalorieGoal * 0.40) / 4;
    const fatGoal = (dailyCalorieGoal * 0.30) / 9;

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    }

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">סיכום יומי</h2>
              <p className="text-slate-500">התקדמות הצריכה הקלורית שלך להיום</p>
            </div>
            <div className="flex gap-2">
                 <button onClick={onOpenUpdateProfile} className="text-slate-500 hover:text-primary-600 p-2" title="ערוך פרופיל">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-cog"><circle cx="18" cy="15" r="3"/><path d="M20 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19.5 12.5 22 15"/><path d="m17 18 2.5 2.5"/><path d="M15 18h-2.5"/><path d="M15 12h-2.5"/><path d="m17 12-2.5-2.5"/><path d="M19.5 17.5 22 15"/></svg>
                </button>
                <button onClick={onOpenUpdateGoal} className="text-slate-500 hover:text-primary-600 p-2" title="עדכן יעדים">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M12 22v-9"/><path d="m20 10-8 4-8-4"/><path d="M4 6l8 4v9"/><path d="M18 22c-1.93 0-3.62-.83-4.83-2.17"/><path d="M12.2 17.8a5.17 5.17 0 0 1-4.37 2.37c-2.85 0-5.17-2.32-5.17-5.17s2.32-5.17 5.17-5.17c.4 0 .79.05 1.17.14"/><path d="M18 16.83c1.93 0 3.62.83 4.83 2.17"/></svg>
                </button>
            </div>
          </div>
          
          <div className="relative w-40 h-40 mx-auto mb-4">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${calorieProgress}, 100`}
                className="text-primary-600"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{Math.round(remainingCalories)}</span>
                <span className="text-sm text-slate-500">קלוריות נותרו</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 divide-x divide-slate-200 dir-ltr">
              <StatCard label="נצרכו" value={Math.round(consumedCalories)} unit="קל'" />
              <StatCard label="מטרה" value={Math.round(dailyCalorieGoal)} unit="קל'" />
              <StatCard label="משקל" value={userProfile.weight} unit="קג" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 space-y-4">
            <MacroProgressBar label="חלבון" value={consumedProtein} goal={proteinGoal} color="bg-sky-500" />
            <MacroProgressBar label="פחמימות" value={consumedCarbs} goal={carbsGoal} color="bg-yellow-500" />
            <MacroProgressBar label="שומן" value={consumedFat} goal={fatGoal} color="bg-rose-500" />
        </div>
      </Card>
      
      {/* Log Actions */}
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={onOpenManualLog} className="w-full p-4 bg-white rounded-xl shadow-md flex items-center justify-center gap-3 text-lg font-semibold text-primary-600 hover:bg-primary-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>הוספה ידנית</span>
            </button>
            <button onClick={onOpenImageLog} className="w-full p-4 bg-white rounded-xl shadow-md flex items-center justify-center gap-3 text-lg font-semibold text-primary-600 hover:bg-primary-50 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                <span>הוספה מתמונה</span>
            </button>
       </div>

      {/* Food Timeline */}
      <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">היומן שלי להיום</h2>
            {foodLog.length > 0 ? (
                <ul className="space-y-4">
                    {foodLog.map(item => (
                        <li key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <p className="font-semibold text-slate-800">{item.name}</p>
                                <p className="text-sm text-slate-500">
                                    {Math.round(item.calories)} קל' &bull; {Math.round(item.protein)} ח' &bull; {Math.round(item.carbs)} פ' &bull; {Math.round(item.fat)} ש'
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-400">{formatTime(item.timestamp)}</span>
                                <button onClick={() => onOpenUpdateTimeline(item)} className="text-slate-400 hover:text-primary-600 p-2" title="ערוך פריט">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-8">
                    <p className="text-slate-500">טרם הוספת פריטים להיום.</p>
                    <p className="text-slate-400 text-sm">השתמש בכפתורים למעלה כדי להתחיל.</p>
                </div>
            )}
            </div>
      </Card>

        {/* Apple Health Integration Info */}
        <Card>
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>
                    </div>
                    <div>
                         <h3 className="font-bold text-slate-800">חיבור ל-Apple Health</h3>
                         <p className="text-sm text-slate-500">רוצה לסנכרן את הנתונים שלך אוטומטית? (מיועד למפתחים)</p>
                    </div>
                </div>
                <button 
                    onClick={onOpenAppleHealthInfo}
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition text-sm font-semibold">
                    פרטים נוספים
                </button>
            </div>
        </Card>
    </div>
  );
};

export default Dashboard;
