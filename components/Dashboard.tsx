import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, FoodItem, Gender, Goal } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';
import Card from './common/Card';
import ImageLogModal from './ImageLogModal';
import ManualLogModal from './ManualLogModal';
import QuickAddModal from './QuickAddModal';
import UpdateGoalModal from './UpdateGoalModal';
import UpdateProfileModal from './UpdateProfileModal';
import AppleHealthInfoModal from './AppleHealthInfoModal';
import EditFoodItemModal from './UpdateTimelineModal';

interface DashboardProps {
  userProfile: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  foodLog: FoodItem[];
  onLogFood: (items: Omit<FoodItem, 'id' | 'timestamp'>[]) => void;
  onDeleteFoodItem: (id: string) => void;
  onUpdateFoodItem: (item: FoodItem) => void;
  ai: GoogleGenAI;
}

const StatCard: React.FC<{ title: string; value: string; unit: string; color: string }> = ({ title, value, unit, color }) => (
    <div className="flex-1 p-4 bg-slate-100 rounded-lg text-center">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-2xl font-bold ${color}`}>
            {value} <span className="text-base font-normal text-slate-600">{unit}</span>
        </p>
    </div>
);

const MacroProgressBar: React.FC<{ name: string, consumed: number, total: number, color: string }> = ({ name, consumed, total, color }) => {
    const percentage = total > 0 ? Math.min((consumed / total) * 100, 100) : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-slate-700">{name}</span>
                <span className="text-slate-500">{Math.round(consumed)} / {Math.round(total)}g</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div className={`${color} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};


// FIX: Implemented the main Dashboard component to display user stats and food logs.
const Dashboard: React.FC<DashboardProps> = ({ userProfile, onUpdateProfile, foodLog, onLogFood, onDeleteFoodItem, onUpdateFoodItem, ai }) => {
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [isManualModalOpen, setManualModalOpen] = useState(false);
  const [isQuickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [isGoalModalOpen, setGoalModalOpen] = useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isAppleHealthModalOpen, setAppleHealthModalOpen] = useState(false);
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);


  const { dailyCalories, dailyProtein, dailyCarbs, dailyFat } = useMemo(() => {
    // Harris-Benedict Equation for BMR
    const bmr = userProfile.gender === Gender.Male
      ? 88.362 + (13.397 * userProfile.weight) + (4.799 * userProfile.height) - (5.677 * userProfile.age)
      : 447.593 + (9.247 * userProfile.weight) + (3.098 * userProfile.height) - (4.330 * userProfile.age);
    
    const tdee = bmr * ACTIVITY_FACTORS[userProfile.activityLevel];
    
    let calorieGoal = tdee + GOAL_ADJUSTMENTS[userProfile.goal];
    
    if (userProfile.goal === Goal.Lose && userProfile.targetWeight && userProfile.loseWeightWeeks) {
        const weightToLose = userProfile.weight - userProfile.targetWeight;
        if (weightToLose > 0 && userProfile.loseWeightWeeks > 0) {
            const weeklyDeficit = (weightToLose * 7700) / userProfile.loseWeightWeeks;
            const dailyDeficit = weeklyDeficit / 7;
            calorieGoal = tdee - dailyDeficit;
        }
    }

    // Macronutrients based on calorie goal (40% Carbs, 30% Protein, 30% Fat)
    const protein = (calorieGoal * 0.30) / 4;
    const carbs = (calorieGoal * 0.40) / 4;
    const fat = (calorieGoal * 0.30) / 9;

    return { 
        dailyCalories: Math.round(calorieGoal),
        dailyProtein: Math.round(protein),
        dailyCarbs: Math.round(carbs),
        dailyFat: Math.round(fat)
    };
  }, [userProfile]);

  const today = new Date().toISOString().split('T')[0];
  const todaysLog = foodLog.filter(item => item.timestamp.startsWith(today));

  const consumed = useMemo(() => {
    return todaysLog.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todaysLog]);

  const caloriesRemaining = dailyCalories - consumed.calories;

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">סיכום יומי</h2>
                    <p className="text-slate-500">יעד קלורי: {dailyCalories} קק"ל</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setProfileModalOpen(true)} className="text-slate-500 hover:text-primary-600 p-2" title="ערוך פרופיל"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg></button>
                    <button onClick={() => setGoalModalOpen(true)} className="text-slate-500 hover:text-primary-600 p-2" title="עדכן יעדים"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></button>
                </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
                <StatCard title="נצרך" value={Math.round(consumed.calories).toString()} unit="קק''ל" color="text-green-600" />
                <StatCard title="נותר" value={Math.round(caloriesRemaining).toString()} unit="קק''ל" color={caloriesRemaining >= 0 ? "text-blue-600" : "text-red-600"} />
            </div>
            <div className="mt-6 space-y-4">
                <MacroProgressBar name="חלבון" consumed={consumed.protein} total={dailyProtein} color="bg-red-500" />
                <MacroProgressBar name="פחמימות" consumed={consumed.carbs} total={dailyCarbs} color="bg-yellow-500" />
                <MacroProgressBar name="שומן" consumed={consumed.fat} total={dailyFat} color="bg-blue-500" />
            </div>
        </div>
      </Card>
      
      <Card>
          <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">הוספת ארוחה</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <button onClick={() => setManualModalOpen(true)} className="p-4 bg-slate-100 rounded-lg hover:bg-primary-100 transition flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 mb-2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      <span className="font-semibold text-slate-700">הוספה ידנית</span>
                  </button>
                   <button onClick={() => setImageModalOpen(true)} className="p-4 bg-slate-100 rounded-lg hover:bg-primary-100 transition flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span className="font-semibold text-slate-700">הוספה מתמונה</span>
                  </button>
                   <button onClick={() => setQuickAddModalOpen(true)} className="p-4 bg-slate-100 rounded-lg hover:bg-primary-100 transition flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 mb-2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      <span className="font-semibold text-slate-700">הוספה מהירה</span>
                  </button>
                  <button onClick={() => setAppleHealthModalOpen(true)} className="p-4 bg-slate-100 rounded-lg hover:bg-primary-100 transition flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 mb-2"><path d="M15.14 2.376a11.5 11.5 0 0 0-11.43 2.872.5.5 0 0 0-.11.621l1.98 3.43a.5.5 0 0 0 .62.22l3.43-1.98a.5.5 0 0 0 .22-.621A4.5 4.5 0 0 1 12 4.5a4.5 4.5 0 0 1 2.43 7.57.5.5 0 0 0 .22.621l3.43 1.98a.5.5 0 0 0 .62-.22l1.98-3.43a.5.5 0 0 0-.11-.622A11.5 11.5 0 0 0 15.14 2.376Z"/><path d="M21.624 8.86a11.5 11.5 0 0 0-2.872-1.43l-3.43 1.98a.5.5 0 0 0-.22.621A4.5 4.5 0 0 1 13.5 12a4.5 4.5 0 0 1-7.57 2.43.5.5 0 0 0-.621.22l-1.98 3.43a.5.5 0 0 0 .22.62l3.43 1.98a.5.5 0 0 0 .62-.22A4.5 4.5 0 0 1 12 19.5a4.5 4.5 0 0 1-2.43-7.57.5.5 0 0 0-.22-.621L5.92 9.33a.5.5 0 0 0-.62.22l-1.98 3.43a.5.5 0 0 0 .11.622 11.5 11.5 0 0 0 15.14 2.876.5.5 0 0 0 .11-.622l-1.98-3.43a.5.5 0 0 0-.62-.22L13.43 14.5a.5.5 0 0 0-.22.621A4.5 4.5 0 0 1 10.5 12a4.5 4.5 0 0 1 7.57-2.43.5.5 0 0 0 .621-.22l1.98-3.43a.5.5 0 0 0-.22-.62Z"/></svg>
                      <span className="font-semibold text-slate-700">Apple Health</span>
                  </button>
              </div>
          </div>
      </Card>
      
      <Card>
          <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">יומן אכילה ({todaysLog.length})</h3>
              {todaysLog.length > 0 ? (
                  <ul className="space-y-3">
                      {todaysLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(item => (
                          <li key={item.id} className="p-3 bg-slate-50 rounded-md flex items-center justify-between">
                              <div>
                                  <p className="font-semibold text-slate-800">{item.name}</p>
                                  <p className="text-sm text-slate-500">{Math.round(item.calories)} קק"ל &bull; {new Date(item.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button onClick={() => setEditingFoodItem(item)} className="text-slate-400 hover:text-blue-500 p-2" title="ערוך פריט"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                                  <button onClick={() => onDeleteFoodItem(item.id)} className="text-slate-400 hover:text-red-500 p-2" title="מחק פריט"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                              </div>
                          </li>
                      ))}
                  </ul>
              ) : (
                  <p className="text-center text-slate-500 py-8">עדיין לא הוספת שום דבר להיום. לחץ על אחת האפשרויות למעלה כדי להתחיל.</p>
              )}
          </div>
      </Card>

      {/* Modals */}
      <ImageLogModal isOpen={isImageModalOpen} onClose={() => setImageModalOpen(false)} onLog={onLogFood} ai={ai} />
      <ManualLogModal isOpen={isManualModalOpen} onClose={() => setManualModalOpen(false)} onLog={onLogFood} ai={ai} />
      <QuickAddModal isOpen={isQuickAddModalOpen} onClose={() => setQuickAddModalOpen(false)} onLog={onLogFood} />
      {userProfile && <UpdateGoalModal isOpen={isGoalModalOpen} onClose={() => setGoalModalOpen(false)} onUpdate={onUpdateProfile} userProfile={userProfile} />}
      {userProfile && <UpdateProfileModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} onUpdate={onUpdateProfile} userProfile={userProfile} />}
      <AppleHealthInfoModal isOpen={isAppleHealthModalOpen} onClose={() => setAppleHealthModalOpen(false)} />
      {editingFoodItem && <EditFoodItemModal isOpen={!!editingFoodItem} onClose={() => setEditingFoodItem(null)} onUpdate={onUpdateFoodItem} foodItem={editingFoodItem} />}
    </div>
  );
};

export default Dashboard;
