import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { UserProfile, FoodItem, NutritionGoals, ModalType } from '../types';
import Card from './common/Card';

interface DashboardProps {
  userProfile: UserProfile;
  foodLog: FoodItem[];
  nutritionGoals: NutritionGoals;
  onOpenModal: (type: ModalType) => void;
  onRemoveFoodItem: (index: number) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  isAiEnabled: boolean;
}

const StatCard: React.FC<{ title: string; value: string | number; unit: string; }> = ({ title, value, unit }) => (
    <div className="bg-slate-100 p-4 rounded-lg text-center">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-primary-600">
            {value} <span className="text-base font-normal text-slate-600">{unit}</span>
        </p>
    </div>
);

const MacroProgressBar: React.FC<{
  name: string;
  value: number;
  goal: number;
  color: string;
}> = ({ name, value, goal, color }) => {
  const progress = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{name}</span>
        <span className="text-sm text-slate-500">{value.toFixed(0)} / {goal.toFixed(0)} ג'</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

const formatDateDisplay = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // The 'YYYY-MM-DD' format is parsed as UTC midnight by default in many JS engines.
    // To ensure a correct comparison with the local `today`, we explicitly construct the 
    // date object in the local timezone by appending the time part.
    const date = new Date(dateString + 'T00:00:00');

    if (date.getTime() === today.getTime()) {
        return 'סיכום יומי';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.getTime() === yesterday.getTime()) {
        return 'אתמול';
    }
    
    return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};


const Dashboard: React.FC<DashboardProps> = ({ userProfile, foodLog, nutritionGoals, onOpenModal, onRemoveFoodItem, selectedDate, onDateChange, isAiEnabled }) => {

  const totals = useMemo(() => {
    return foodLog.reduce(
      (acc, item) => {
        acc.calories += item.calories;
        acc.protein += item.protein;
        acc.carbs += item.carbs;
        acc.fat += item.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [foodLog]);

  const caloriesRemaining = nutritionGoals.tdee - totals.calories;
  const calorieProgress = nutritionGoals.tdee > 0 ? Math.min((totals.calories / nutritionGoals.tdee) * 100, 100) : 0;

  const macroData = [
    { name: 'חלבון', value: totals.protein, goal: nutritionGoals.protein, fill: '#3b82f6', colorClass: 'bg-primary-500' },
    { name: 'פחמימות', value: totals.carbs, goal: nutritionGoals.carbs, fill: '#10b981', colorClass: 'bg-emerald-500' },
    { name: 'שומן', value: totals.fat, goal: nutritionGoals.fat, fill: '#f59e0b', colorClass: 'bg-amber-500' },
  ];
  
  const today = new Date().toLocaleDateString('en-CA');
  const isToday = selectedDate === today;

  const handleDateChange = (days: number) => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + days);
    onDateChange(currentDate.toLocaleDateString('en-CA'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors" aria-label="היום הקודם">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <h2 className="text-2xl font-bold text-slate-800">{formatDateDisplay(selectedDate)}</h2>
              <button onClick={() => handleDateChange(1)} disabled={isToday} className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="היום הבא">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="יעד קלורי" value={nutritionGoals.tdee} unit="קל'" />
                <StatCard title="נצרך" value={totals.calories.toFixed(0)} unit="קל'" />
                <StatCard title="נותר" value={caloriesRemaining.toFixed(0)} unit="קל'" />
                <StatCard title="BMI" value={nutritionGoals.bmi} unit="" />
            </div>
            <div className="mt-6">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-sm text-slate-500">התקדמות קלורית</p>
                  <p className="text-sm font-semibold text-primary-600">{calorieProgress.toFixed(0)}%</p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-5 relative">
                    <div 
                        className="bg-primary-500 h-5 rounded-full transition-all duration-500 flex items-center justify-center text-white text-xs font-bold" 
                        style={{ width: `${calorieProgress}%` }}>
                    </div>
                     <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white mix-blend-lighten">
                        {totals.calories.toFixed(0)} / {nutritionGoals.tdee}
                    </span>
                </div>
            </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-4">מאקרו-נוטריינטים (גרם)</h3>
            <div style={{width: '100%', height: 250}}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label={({ name, value }) => `${name}: ${value.toFixed(0)}g`}>
                    {macroData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Pie>
                   <Tooltip formatter={(value, name) => [`${(value as number).toFixed(0)} / ${macroData.find(d => d.name === name)?.goal}g`, name]}/>
                   <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 space-y-4">
               {macroData.map(macro => (
                 <MacroProgressBar
                   key={macro.name}
                   name={macro.name}
                   value={macro.value}
                   goal={macro.goal}
                   color={macro.colorClass}
                 />
               ))}
            </div>
          </div>
        </Card>

        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">הוספת ארוחה</h3>
                <p className="text-slate-500 mb-6">הוסף את הארוחה שלך בצורה ידנית או בעזרת המצלמה.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={() => onOpenModal('manual')} disabled={!isToday || !isAiEnabled} className="w-full flex items-center justify-center gap-2 p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M11 6.16A5.84 5.84 0 0 0 11 12a6 6 0 0 0 6 6h.01"/><path d="M12 12a6 6 0 0 1 6-6h.01"/><path d="M6 12a6 6 0 0 1 6-6h.01"/><path d="M17.84 18a5.84 5.84 0 0 0 0-11.68"/><path d="M12 6a6 6 0 0 0-6 6h.01"/></svg>
                        הוספה ידנית
                    </button>
                    <button onClick={() => onOpenModal('image')} disabled={!isToday || !isAiEnabled} className="w-full flex items-center justify-center gap-2 p-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                        זיהוי מתמונה
                    </button>
                </div>
                 {!isAiEnabled && (
                    <div className="mt-4 p-4 bg-amber-50 text-amber-900 rounded-lg">
                        <p className="font-bold">תכונות ה-AI מושבתות.</p>
                        <p className="text-sm mt-1">כדי להפעילן, יש להגדיר מפתח API של Gemini בסביבת הפרויקט.</p>
                    </div>
                )}
                {isAiEnabled && !isToday && <p className="text-center text-sm text-slate-500 mt-4">ניתן להוסיף אוכל רק עבור היום הנוכחי.</p>}
            </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">יומן אכילה</h3>
          {foodLog.length > 0 ? (
            <ul className="space-y-3">
              {foodLog.map((item, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                    <div>
                        <p className="font-semibold text-slate-700">{item.name}</p>
                        <p className="text-sm text-slate-500">
                            {item.calories.toFixed(0)} קל' &bull; {item.protein.toFixed(0)}ח &bull; {item.carbs.toFixed(0)}פ &bull; {item.fat.toFixed(0)}ש
                        </p>
                    </div>
                    <button onClick={() => onRemoveFoodItem(index)} disabled={!isToday} className="text-red-500 hover:text-red-700 p-1 disabled:text-slate-400 disabled:cursor-not-allowed">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500 py-4">
              {isToday ? "עדיין לא הוספת שום דבר היום." : `לא נרשם אוכל בתאריך זה.`}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;