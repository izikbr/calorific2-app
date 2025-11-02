import React, { useMemo, useState, useEffect } from 'react';
import { UserProfile, FoodItem, WeightEntry, ModalType, Gender, ActivityLevel, Goal, NutritionGoals } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';
import Card from './common/Card';
import dayjs from 'dayjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';


// --- Utility Functions ---

const calculateNutritionGoals = (profile: UserProfile): NutritionGoals => {
  const { gender, weight, height, age, activityLevel, goal, targetWeight, loseWeightWeeks } = profile;
  if (!weight || !height || !age) {
    return { tdee: 0, bmi: 0, protein: 0, carbs: 0, fat: 0 };
  }

  let bmr: number;
  if (gender === Gender.Male) {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityFactor = ACTIVITY_FACTORS[activityLevel as ActivityLevel];
  let tdee = bmr * activityFactor;

  if (goal === Goal.Lose && loseWeightWeeks && targetWeight && weight > targetWeight) {
      const weightToLose = weight - targetWeight;
      const weeklyCalorieDeficit = (weightToLose * 7700) / loseWeightWeeks;
      const dailyDeficit = weeklyCalorieDeficit / 7;
      tdee -= dailyDeficit;
  } else {
      tdee += GOAL_ADJUSTMENTS[goal];
  }

  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  const protein = (tdee * 0.30) / 4;
  const carbs = (tdee * 0.40) / 4;
  const fat = (tdee * 0.30) / 9;

  return {
    tdee: Math.round(tdee),
    bmi: parseFloat(bmi.toFixed(1)),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
};

const getBmiCategory = (bmi: number): { category: string; color: string } => {
    if (bmi < 18.5) return { category: 'תת משקל', color: 'text-blue-500' };
    if (bmi >= 18.5 && bmi < 24.9) return { category: 'משקל תקין', color: 'text-green-500' };
    if (bmi >= 25 && bmi < 29.9) return { category: 'עודף משקל', color: 'text-amber-500' };
    return { category: 'השמנת יתר', color: 'text-red-500' };
};

// --- Component Interfaces ---

interface DashboardProps {
  userProfile: UserProfile;
  foodLog: FoodItem[];
  weightLog: WeightEntry[];
  onRemoveFood: (timestamp: string) => void;
  onAddWeight: (weight: number) => void;
  setModal: (modal: ModalType) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

// --- Sub-components ---
const StatCard: React.FC<{ label: string; value: string | number; subValue?: string; subValueColor?: string; icon?: React.ReactNode }> = ({ label, value, subValue, subValueColor, icon }) => (
    <div className="bg-slate-100/50 p-4 rounded-lg flex-1 text-center">
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {subValue && <p className={`text-sm font-semibold ${subValueColor}`}>{subValue}</p>}
    </div>
);


const MacroBar: React.FC<{ value: number; total: number; label: string; color: string }> = ({ value, total, label, color }) => {
  const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div>
        <div className="flex justify-between text-sm mb-1">
            <span className="font-medium text-slate-700">{label}</span>
            <span className="text-slate-500">{Math.round(value)} / {Math.round(total)}g</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
            <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
    </div>
  );
};


// --- Main Component ---

const Dashboard: React.FC<DashboardProps> = ({
  userProfile,
  foodLog,
  weightLog,
  onRemoveFood,
  onAddWeight,
  setModal,
  selectedDate,
  setSelectedDate,
}) => {
  const [newWeight, setNewWeight] = useState<string>(userProfile.weight.toString());
  const [weightUpdateSuccess, setWeightUpdateSuccess] = useState(false);

  const nutritionGoals = useMemo(() => calculateNutritionGoals(userProfile), [userProfile]);
  const bmiCategory = useMemo(() => getBmiCategory(nutritionGoals.bmi), [nutritionGoals.bmi]);

  const dailyTotals = useMemo(() => {
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

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightValue = parseFloat(newWeight);
    if (!isNaN(weightValue) && weightValue > 0) {
        onAddWeight(weightValue);
        setWeightUpdateSuccess(true);
        setTimeout(() => setWeightUpdateSuccess(false), 2000);
    }
  };

  useEffect(() => {
    setNewWeight(userProfile.weight.toString());
  }, [userProfile.weight]);

  const handleDateChange = (days: number) => {
    setSelectedDate(dayjs(selectedDate).add(days, 'day').toDate());
  };

  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
         <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-slate-100" aria-label="היום הקודם">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
         </button>
         <h2 className="text-lg font-semibold text-slate-700">
            {isToday ? 'סיכום יומי' : dayjs(selectedDate).format('dddd, D MMMM')}
         </h2>
         <button onClick={() => handleDateChange(1)} disabled={isToday} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="היום הבא">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
         </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="BMI" value={nutritionGoals.bmi} subValue={bmiCategory.category} subValueColor={bmiCategory.color} />
          <StatCard label="יעד קלורי" value={nutritionGoals.tdee.toLocaleString()} />
          <StatCard label="נצרך" value={Math.round(dailyTotals.calories).toLocaleString()} />
          <StatCard label="נותר" value={Math.round(nutritionGoals.tdee - dailyTotals.calories).toLocaleString()} />
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${Math.min((dailyTotals.calories / nutritionGoals.tdee) * 100, 100)}%` }}></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
            <div className="p-6">
                 <h2 className="text-xl font-bold text-slate-800 mb-4">הוספת ארוחה</h2>
                 <p className="text-slate-500 mb-4 text-sm">הוסף את הארוחה שלך בצורה ידנית או בעזרת המצלמה.</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button onClick={() => setModal('manual')} disabled={!isToday} className="w-full p-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        הוספה ידנית
                     </button>
                     <button onClick={() => setModal('image')} disabled={!isToday} className="w-full p-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        זיהוי מתמונה
                     </button>
                 </div>
                 {!isToday && <p className="text-center text-slate-500 text-xs mt-3">ניתן להוסיף פריטים רק עבור היום הנוכחי.</p>}
            </div>
        </Card>
        <Card>
           <div className="p-6">
             <h2 className="text-xl font-bold text-slate-800 mb-4">מאקרו-נוטריינטים (גרם)</h2>
             <div className="flex flex-col space-y-4">
                <MacroBar value={dailyTotals.protein} total={nutritionGoals.protein} label="חלבון" color="bg-sky-500"/>
                <MacroBar value={dailyTotals.carbs} total={nutritionGoals.carbs} label="פחמימות" color="bg-amber-500"/>
                <MacroBar value={dailyTotals.fat} total={nutritionGoals.fat} label="שומן" color="bg-pink-500"/>
             </div>
           </div>
        </Card>
      </div>

       <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">מעקב משקל</h2>
            <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightLog.map(e => ({...e, date: dayjs(e.date).format('D/M')}))} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" />
                        <YAxis stroke="#64748b" domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="weight" name="משקל (קג)" stroke="#0284c7" strokeWidth={2} activeDot={{ r: 8 }} />
                        {userProfile.targetWeight && <ReferenceLine y={userProfile.targetWeight} label={{ value: 'יעד', position: 'insideTopLeft' }} stroke="#16a34a" strokeDasharray="3 3" />}
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <form onSubmit={handleWeightSubmit}>
                <label className="block text-sm font-medium text-slate-600 mb-1">עדכון משקל להיום</label>
                <div className="flex gap-2 items-center">
                    <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} disabled={!isToday} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-slate-100" />
                    <button type="submit" disabled={!isToday} className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed">שמור</button>
                     {weightUpdateSuccess && <span className="text-green-600 text-sm font-semibold">נשמר!</span>}
                </div>
                 {!isToday && <p className="text-center text-slate-500 text-xs mt-2">ניתן להוסיף משקל רק עבור היום הנוכחי.</p>}
            </form>
          </div>
       </Card>

      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">יומן אכילה</h2>
          {foodLog.length > 0 ? (
            <ul className="space-y-3">
              {foodLog.map((item) => (
                <li key={item.timestamp} className="group flex items-center justify-between p-3 bg-slate-50 rounded-md">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.calories.toFixed(0)} קל' &bull; {dayjs(item.timestamp).format('HH:mm')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-600 hidden sm:block">
                        ח: {item.protein.toFixed(0)} | פ: {item.carbs.toFixed(0)} | ש: {item.fat.toFixed(0)}
                    </p>
                    {isToday && 
                        <button onClick={() => onRemoveFood(item.timestamp)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1" aria-label={`מחק את ${item.name}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    }
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500 py-4">לא נרשמו פריטים לתאריך זה.</p>
          )}
        </div>
      </Card>
      
    </div>
  );
};

export default Dashboard;