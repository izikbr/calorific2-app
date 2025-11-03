import React, { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { UserProfile, FoodItem, Gender, Goal, WeightEntry } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

import Card from './common/Card';
import CircularProgress from './common/CircularProgress';
import ImageLogModal from './ImageLogModal';
import ManualLogModal from './ManualLogModal';
import QuickAddModal from './QuickAddModal';
import UpdateProfileModal from './UpdateProfileModal';
import EditFoodItemModal from './EditFoodItemModal';
import UpdateGoalTimelineModal from './UpdateGoalTimelineModal';

interface DashboardProps {
  userProfile: UserProfile;
  onUpdateProfile: (updatedData: Partial<UserProfile>) => void;
  onUpdateFoodLog: (foodLog: FoodItem[]) => void;
  onAddWeight: (date: string, weight: number) => void;
  ai: GoogleGenAI;
}

const formatDateDisplay = (dateStr: string) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'סיכום יומי';
    if (dateStr === yesterdayStr) return 'אתמול';
    
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onUpdateProfile, onUpdateFoodLog, onAddWeight, ai }) => {
  const [activeModal, setActiveModal] = useState<null | 'image' | 'manual' | 'quickAdd' | 'updateProfile' | 'updateTimeline' | 'editFoodItem'>(null);
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentWeightInput, setCurrentWeightInput] = useState<string>('');
  const [weightSaved, setWeightSaved] = useState(false);


  useEffect(() => {
    const todayWeight = userProfile.weightLog?.find(entry => entry.date === selectedDate)?.weight;
    setCurrentWeightInput(todayWeight ? String(todayWeight) : '');
  }, [selectedDate, userProfile.weightLog]);

  const { dailyCalories, dailyProtein, dailyCarbs, dailyFat, bmi } = useMemo(() => {
    const { gender, weight, height, age, activityLevel, goal, targetWeight, loseWeightWeeks } = userProfile;
    // Harris-Benedict BMR Formula
    const bmr = gender === Gender.Male
      ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
      : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    
    const tdee = bmr * ACTIVITY_FACTORS[activityLevel];
    
    let goalAdjustment = GOAL_ADJUSTMENTS[goal] || 0;

    if (goal === Goal.Lose && loseWeightWeeks && loseWeightWeeks > 0) {
        const weightToLose = weight - targetWeight;
        if (weightToLose > 0) {
            const totalCalorieDeficit = weightToLose * 7700;
            const dailyDeficit = totalCalorieDeficit / (loseWeightWeeks * 7);
            goalAdjustment = -dailyDeficit;
        }
    }

    const finalCalories = Math.round(tdee + goalAdjustment);

    const proteinGrams = Math.round((finalCalories * 0.30) / 4);
    const carbsGrams = Math.round((finalCalories * 0.40) / 4);
    const fatGrams = Math.round((finalCalories * 0.30) / 9);
    
    const bmiValue = weight / ((height / 100) ** 2);

    return { 
      dailyCalories: finalCalories, 
      dailyProtein: proteinGrams, 
      dailyCarbs: carbsGrams, 
      dailyFat: fatGrams,
      bmi: bmiValue,
    };
  }, [userProfile]);

  const foodLogForSelectedDate = useMemo(() => {
    return (userProfile.foodLog || [])
        .filter(item => item.timestamp.startsWith(selectedDate))
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [userProfile.foodLog, selectedDate]);

  const consumed = useMemo(() => {
    return foodLogForSelectedDate.reduce((acc, item) => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs;
      acc.fat += item.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [foodLogForSelectedDate]);
  
  const chartData = useMemo(() => {
    const combinedData: { [date: string]: { date: string; weight?: number; calories?: number } } = {};

    (userProfile.weightLog || []).forEach(entry => {
        combinedData[entry.date] = { ...combinedData[entry.date], date: entry.date, weight: entry.weight };
    });

    (userProfile.foodLog || []).forEach(item => {
        const date = item.timestamp.split('T')[0];
        if (!combinedData[date]) {
            combinedData[date] = { date };
        }
        combinedData[date].calories = (combinedData[date].calories || 0) + item.calories;
    });

    return Object.values(combinedData).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [userProfile.weightLog, userProfile.foodLog]);


  const handleLogItems = (items: Omit<FoodItem, 'id'>[]) => {
    const newItems = items.map(item => ({...item, id: uuidv4(), timestamp: new Date().toISOString() }));
    const updatedLog = [...(userProfile.foodLog || []), ...newItems];
    onUpdateFoodLog(updatedLog);
  };
  
  const handleUpdateItem = (updatedItem: FoodItem) => {
    const updatedLog = (userProfile.foodLog || []).map(item => item.id === updatedItem.id ? updatedItem : item);
    onUpdateFoodLog(updatedLog);
    setEditingFoodItem(null);
    setActiveModal(null);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק פריט זה?")) {
        const updatedLog = (userProfile.foodLog || []).filter(item => item.id !== itemId);
        onUpdateFoodLog(updatedLog);
    }
  };
  
  const handleDateChange = (direction: 'prev' | 'next') => {
      const currentDate = new Date(selectedDate);
      if (direction === 'prev') {
          currentDate.setDate(currentDate.getDate() - 1);
      } else {
          currentDate.setDate(currentDate.getDate() + 1);
      }
      setSelectedDate(currentDate.toISOString().split('T')[0]);
  };
  
  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weight = parseFloat(currentWeightInput);
    if (!isNaN(weight) && weight > 0) {
        onAddWeight(selectedDate, weight);
        setWeightSaved(true);
        setTimeout(() => setWeightSaved(false), 2000); // Hide message after 2s
    }
  };


  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const getBmiCategory = (bmiValue: number) => {
    if (bmiValue < 18.5) return { text: 'תת משקל', color: 'text-blue-500' };
    if (bmiValue < 25) return { text: 'משקל תקין', color: 'text-green-500' };
    if (bmiValue < 30) return { text: 'עודף משקל', color: 'text-amber-500' };
    return { text: 'השמנת יתר', color: 'text-red-500' };
  };

  const bmiCategory = getBmiCategory(bmi);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <button onClick={() => handleDateChange('prev')} className="p-2 rounded-full hover:bg-slate-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
          <h2 className="text-2xl font-bold text-slate-800">{formatDateDisplay(selectedDate)}</h2>
          <button onClick={() => handleDateChange('next')} className="p-2 rounded-full hover:bg-slate-200 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
              <p className="text-sm text-slate-500">BMI</p>
              <p className="text-3xl font-bold text-slate-800">{bmi.toFixed(1)}</p>
              <p className={`text-sm font-semibold ${bmiCategory.color}`}>{bmiCategory.text}</p>
          </Card>
          <Card className={`p-4 text-center ${userProfile.goal === Goal.Lose ? 'cursor-pointer hover:bg-slate-100 transition' : ''}`} onClick={() => userProfile.goal === Goal.Lose && setActiveModal('updateTimeline')}>
              <p className="text-sm text-slate-500">יעד קלורי</p>
              <p className="text-3xl font-bold text-slate-800">{dailyCalories.toLocaleString()}</p>
              <p className="text-sm text-slate-500">קלוריות</p>
          </Card>
           <Card className="p-4 text-center">
              <p className="text-sm text-slate-500">נצרך</p>
              <p className="text-3xl font-bold text-slate-800">{Math.round(consumed.calories).toLocaleString()}</p>
              <p className="text-sm text-slate-500">קלוריות</p>
          </Card>
          <Card className="p-4 text-center">
              <p className="text-sm text-slate-500">נותר</p>
              <p className="text-3xl font-bold text-primary-600">{Math.round(dailyCalories - consumed.calories).toLocaleString()}</p>
              <p className="text-sm text-slate-500">קלוריות</p>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">סיכום יומי</h3>
                    <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden mb-6">
                        <div className="absolute top-0 left-0 h-full bg-primary-500" style={{width: `${Math.min(100, (consumed.calories / dailyCalories) * 100)}%`}}></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                         <div>
                            <p className="font-semibold text-slate-600">חלבון</p>
                            <p className="text-lg font-bold text-slate-800">{Math.round(consumed.protein)}<span className="text-sm text-slate-500"> / {dailyProtein}g</span></p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-600">פחמימות</p>
                            <p className="text-lg font-bold text-slate-800">{Math.round(consumed.carbs)}<span className="text-sm text-slate-500"> / {dailyCarbs}g</span></p>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-600">שומן</p>
                            <p className="text-lg font-bold text-slate-800">{Math.round(consumed.fat)}<span className="text-sm text-slate-500"> / {dailyFat}g</span></p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
              <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-800 mb-4">היומן שלי</h3>
                  {foodLogForSelectedDate.length > 0 ? (
                      <ul className="space-y-1 -mr-3 -ml-3">
                        {foodLogForSelectedDate.map(item => (
                            <li key={item.id} className="group flex items-center gap-4 p-3 hover:bg-slate-100 rounded-md">
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-800">{item.name}</p>
                                    <p className="text-sm text-slate-500">
                                        {`${Math.round(item.calories)} קל' | ח': ${Math.round(item.protein)}ג, פ': ${Math.round(item.carbs)}ג, ש': ${Math.round(item.fat)}ג`}
                                    </p>
                                </div>
                                <div className="relative">
                                     <button onClick={() => setEditingFoodItem(item)} title="ערוך פריט" className="p-2 text-slate-500 hover:text-primary-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                     </button>
                                </div>
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <div className="text-center text-slate-500 py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400 mb-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4l2 1"/><path d="M17 12h-1a4 4 0 0 0-4-4V7"/></svg>
                        <p>היומן להיום ריק.</p>
                      </div>
                  )}
              </div>
          </Card>
        </div>
        
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">הוספה ליומן</h3>
                    <div className="space-y-3">
                        <button onClick={() => setActiveModal('quickAdd')} className="w-full flex items-center gap-3 p-4 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition text-start">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 3v7h7"/><path d="M13 3 5 11v9h9l8-8-7-7Z"/></svg>
                            <span className="font-semibold">הוספה מהירה</span>
                        </button>
                        <button onClick={() => setActiveModal('image')} className="w-full flex items-center gap-3 p-4 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-start">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                            <span className="font-semibold">הוסף מתמונה</span>
                        </button>
                        <button onClick={() => setActiveModal('manual')} className="w-full flex items-center gap-3 p-4 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-start">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                            <span className="font-semibold">הוסף ידנית</span>
                        </button>
                    </div>
                </div>
            </Card>
            <Card>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">מגמות ומשקל</h3>
                     {isToday && (
                        <form onSubmit={handleWeightSubmit} className="flex gap-2 mb-4">
                            <input 
                                type="number" 
                                step="0.1"
                                value={currentWeightInput}
                                onChange={(e) => setCurrentWeightInput(e.target.value)}
                                placeholder="הזן משקל עדכני (ק״ג)"
                                className="flex-grow p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">שמור</button>
                        </form>
                    )}
                    {weightSaved && <p className="text-sm text-green-600 mb-4 -mt-2">נשמר!</p>}

                    <div className="h-64">
                         {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(dateStr) => new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit'})} />
                                    <YAxis yAxisId="left" stroke="#0284c7" label={{ value: 'משקל (ק"ג)', angle: -90, position: 'insideLeft', fill: '#0284c7' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#16a34a" label={{ value: 'קלוריות', angle: -90, position: 'insideRight', fill: '#16a34a' }} />
                                    <Tooltip formatter={(value, name) => [value, name === 'weight' ? 'משקל' : 'קלוריות']} labelFormatter={(label) => new Date(label).toLocaleDateString('he-IL')}/>
                                    <Legend />
                                    <ReferenceLine y={userProfile.targetWeight} yAxisId="left" label={{ value: 'יעד', position: 'insideTopLeft' }} stroke="red" strokeDasharray="3 3" />
                                    <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={2} name="משקל" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#16a34a" strokeWidth={2} name="קלוריות" />
                                </LineChart>
                            </ResponsiveContainer>
                         ) : (
                            <div className="text-center text-slate-500 pt-12">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400 mb-2"><path d="M3 3v18h18"/><path d="M18.7 8a5 5 0 0 1-6.4 0l-6.3 6.3"/><path d="M12.3 14.7a5 5 0 0 1 6.4 0"/><path d="M12 18H3"/></svg>
                                <p>הזן נתונים כדי לראות את המגמות.</p>
                            </div>
                         )}
                    </div>
                </div>
            </Card>
            <Card>
                <div className="p-4">
                     <button onClick={() => setActiveModal('updateProfile')} className="w-full text-center p-3 text-primary-600 font-semibold hover:bg-slate-100 rounded-md transition">
                        עדכן פרופיל
                    </button>
                </div>
            </Card>
        </div>
      </div>


      <ImageLogModal isOpen={activeModal === 'image'} onClose={() => setActiveModal(null)} onLog={handleLogItems} ai={ai} />
      <ManualLogModal isOpen={activeModal === 'manual'} onClose={() => setActiveModal(null)} onLog={handleLogItems} ai={ai} />
      <QuickAddModal isOpen={activeModal === 'quickAdd'} onClose={() => setActiveModal(null)} onLog={handleLogItems} />
      <UpdateProfileModal isOpen={activeModal === 'updateProfile'} onClose={() => setActiveModal(null)} onUpdate={onUpdateProfile} userProfile={userProfile} />
      <UpdateGoalTimelineModal isOpen={activeModal === 'updateTimeline'} onClose={() => setActiveModal(null)} onUpdate={onUpdateProfile} userProfile={userProfile} />
      {editingFoodItem && <EditFoodItemModal isOpen={true} onClose={() => setEditingFoodItem(null)} onUpdate={handleUpdateItem} foodItem={editingFoodItem} />}
    </div>
  );
};

export default Dashboard;