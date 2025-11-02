import React, { useMemo, useState } from 'react';
import { UserProfile, FoodItem, ModalType } from '../types';
import Card from './common/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface DashboardProps {
  userProfile: UserProfile;
  foodLog: FoodItem[];
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  setActiveModal: (modal: ModalType | null) => void;
  onEditItem: (item: FoodItem) => void;
  onAddWeight: (weight: number) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; description: string; className?: string; isClickable?: boolean; onClick?: () => void; }> = ({ label, value, description, className = '', isClickable, onClick }) => (
    <div className={`p-4 bg-slate-50 rounded-lg ${className} ${isClickable ? 'cursor-pointer hover:bg-slate-100' : ''}`} onClick={onClick}>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-400">{description}</p>
    </div>
);

const MacroProgressBar: React.FC<{ label: string; value: number; goal: number; color: string }> = ({ label, value, goal, color }) => {
    const percentage = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <span className="text-sm text-slate-500">{Math.round(value)} / {Math.round(goal)} גרם</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ 
    userProfile, 
    foodLog,
    selectedDate,
    setSelectedDate,
    setActiveModal,
    onEditItem,
    onAddWeight
}) => {
    const [dailyWeight, setDailyWeight] = useState('');
    const [weightSaved, setWeightSaved] = useState(false);

    const { weight, height, gender, age, activityLevel, goal, targetWeight, loseWeightWeeks } = userProfile;
    
    const nutritionGoals = useMemo(() => {
        if (!userProfile) return { calorieGoal: 2000, proteinGoal: 100, carbsGoal: 250, fatGoal: 65, bmi: { value: 0, category: 'N/A' } };

        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }
        
        const activityFactorMap = { low: 1.375, medium: 1.55, high: 1.725 };
        const tdee = bmr * activityFactorMap[activityLevel];

        let calorieGoal = tdee;

        if (goal === 'lose' && targetWeight && loseWeightWeeks && loseWeightWeeks > 0 && weight > targetWeight) {
            const totalDeficit = (weight - targetWeight) * 7700;
            const dailyDeficit = totalDeficit / (loseWeightWeeks * 7);
            calorieGoal = Math.max(1200, tdee - dailyDeficit);
        } else {
            const goalAdjustmentMap = { lose: -400, maintain: 0, gain: 400 };
            calorieGoal = tdee + goalAdjustmentMap[goal];
        }

        const proteinGoal = (calorieGoal * 0.30) / 4;
        const carbsGoal = (calorieGoal * 0.40) / 4;
        const fatGoal = (calorieGoal * 0.30) / 9;
        
        const bmiValue = height > 0 ? (weight / ((height / 100) ** 2)) : 0;
        let bmiCategory = "לא ידוע";
        let bmiColor = "text-slate-500";
        if (bmiValue < 18.5) {
            bmiCategory = "תת משקל";
            bmiColor = "text-blue-500";
        } else if (bmiValue < 24.9) {
            bmiCategory = "משקל תקין";
            bmiColor = "text-green-500";
        } else if (bmiValue < 29.9) {
            bmiCategory = "עודף משקל";
            bmiColor = "text-amber-500";
        } else if (bmiValue >= 30) {
            bmiCategory = "השמנת יתר";
            bmiColor = "text-red-500";
        }

        return { 
            calorieGoal, 
            proteinGoal, 
            carbsGoal, 
            fatGoal,
            bmi: {
                value: parseFloat(bmiValue.toFixed(1)),
                category: bmiCategory,
                color: bmiColor
            }
        };
    }, [userProfile]);

    const { calorieGoal, proteinGoal, carbsGoal, fatGoal, bmi } = nutritionGoals;

    const consumedCalories = foodLog.reduce((acc, item) => acc + item.calories, 0);
    const consumedProtein = foodLog.reduce((acc, item) => acc + item.protein, 0);
    const consumedCarbs = foodLog.reduce((acc, item) => acc + item.carbs, 0);
    const consumedFat = foodLog.reduce((acc, item) => acc + item.fat, 0);
    
    const remainingCalories = calorieGoal - consumedCalories;
    const calorieProgress = calorieGoal > 0 ? Math.min((consumedCalories / calorieGoal) * 100, 100) : 0;

    const formatTime = (isoString: string) => new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();

    const handleDateChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
        setSelectedDate(newDate);
    };

    const formatDateDisplay = (date: Date) => {
        const diff = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'סיכום יומי';
        if (diff === 1) return 'סיכום - אתמול';
        return `סיכום - ${date.toLocaleDateString('he-IL')}`;
    };

    const handleWeightSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const weightValue = parseFloat(dailyWeight);
        if (weightValue > 0) {
            onAddWeight(weightValue);
            setDailyWeight('');
            setWeightSaved(true);
            setTimeout(() => setWeightSaved(false), 2000);
        }
    };
    
    const weightLogData = useMemo(() => {
        return userProfile.weightLog?.map(entry => ({
            date: new Date(entry.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit'}),
            משקל: entry.weight
        })) || [];
    }, [userProfile.weightLog]);
    
  return (
    <div className="space-y-6">
        {/* Date Navigator */}
        <div className="flex justify-between items-center">
            <button onClick={() => handleDateChange('prev')} className="p-2 rounded-full hover:bg-slate-200 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <h2 className="text-xl font-bold text-slate-800">{formatDateDisplay(selectedDate)}</h2>
            <button onClick={() => handleDateChange('next')} disabled={isToday} className="p-2 rounded-full hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
        </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="BMI" value={bmi.value} description={bmi.category} className={bmi.color} />
          <StatCard label="יעד קלורי" value={Math.round(calorieGoal)} description="היעד היומי שלך" isClickable={userProfile.goal === 'lose'} onClick={() => userProfile.goal === 'lose' && setActiveModal('updateTimeline')} />
          <StatCard label="נצרך" value={Math.round(consumedCalories)} description="קלוריות שאכלת" />
          <StatCard label="נותר" value={Math.round(remainingCalories)} description="קלוריות להיום" />
      </div>
       <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${calorieProgress}%` }}></div>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            {/* Log Actions */}
            <Card>
                <div className="p-4">
                <h3 className="font-bold text-slate-800 mb-3">הוספת ארוחה</h3>
                 {!isToday ? (
                     <p className="text-center text-slate-500 bg-slate-100 p-4 rounded-md">ניתן להוסיף מזון רק עבור היום הנוכחי.</p>
                 ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button onClick={() => setActiveModal('quickAdd')} className="w-full p-3 bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-green-600 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                            <span>הוספה מהירה</span>
                        </button>
                        <button onClick={() => setActiveModal('manualLog')} className="w-full p-3 bg-primary-500 text-white rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-primary-600 transition">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            <span>הוספה ידנית</span>
                        </button>
                        <button onClick={() => setActiveModal('imageLog')} className="w-full p-3 bg-primary-500 text-white rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-primary-600 transition">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                            <span>זיהוי מתמונה</span>
                        </button>
                    </div>
                 )}
                </div>
            </Card>

            {/* Macros */}
            <Card>
                <div className="p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 mb-2">מאקרו-נוטריינטים</h3>
                    <MacroProgressBar label="חלבון" value={consumedProtein} goal={proteinGoal} color="bg-sky-500" />
                    <MacroProgressBar label="פחמימות" value={consumedCarbs} goal={carbsGoal} color="bg-amber-500" />
                    <MacroProgressBar label="שומן" value={consumedFat} goal={fatGoal} color="bg-rose-500" />
                </div>
            </Card>
            
             {/* Weight Tracker */}
            <Card>
                <div className="p-4">
                    <h3 className="font-bold text-slate-800 mb-3">מעקב משקל</h3>
                    <div className="h-48">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weightLogData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine y={targetWeight} label={{ value: 'יעד', position: 'insideTopLeft' }} stroke="red" strokeDasharray="3 3" />
                                <Line type="monotone" dataKey="משקל" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {isToday && (
                         <form onSubmit={handleWeightSubmit} className="mt-4 flex items-center gap-2">
                            <input 
                                type="number" 
                                step="0.1"
                                placeholder={`המשקל שלך היום (${userProfile.weight} ק"ג)`}
                                value={dailyWeight}
                                onChange={(e) => setDailyWeight(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition font-semibold" disabled={!dailyWeight}>
                                {weightSaved ? 'נשמר!' : 'עדכן'}
                            </button>
                        </form>
                    )}
                </div>
            </Card>

        </div>
        
        {/* Food Timeline */}
        <Card>
          <div className="p-4">
            <h3 className="font-bold text-slate-800 mb-3">היומן שלי</h3>
            <div className="max-h-[600px] overflow-y-auto">
                {foodLog.length > 0 ? (
                    <ul className="space-y-3">
                        {foodLog.map(item => (
                            <li key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-slate-800">{item.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {Math.round(item.calories)} קל' &bull; {Math.round(item.protein)} ח' &bull; {Math.round(item.carbs)} פ' &bull; {Math.round(item.fat)} ש'
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-slate-400">{formatTime(item.timestamp)}</span>
                                    {isToday && 
                                        <button onClick={() => onEditItem(item)} className="text-slate-400 hover:text-primary-600 p-1" title="ערוך פריט">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </button>
                                    }
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-slate-500">היומן עבור יום זה ריק.</p>
                        {isToday && <p className="text-slate-400 text-sm">השתמש בכפתורים כדי להתחיל.</p>}
                    </div>
                )}
            </div>
            </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
