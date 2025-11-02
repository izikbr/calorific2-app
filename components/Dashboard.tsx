import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, FoodItem, Gender, ActivityLevel, Goal } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';
import Card from './common/Card';
import ManualLogModal from './ManualLogModal';
import ImageLogModal from './ImageLogModal';
import UpdateGoalModal from './UpdateGoalModal';
import UpdateProfileModal from './UpdateProfileModal';
import UpdateTimelineModal from './UpdateTimelineModal';
import AppleHealthInfoModal from './AppleHealthInfoModal';

interface DashboardProps {
  userProfile: UserProfile;
  onUpdateProfile: (updatedProfile: Partial<UserProfile>) => void;
  onAddFood: (foodItems: FoodItem[]) => void;
  onUpdateFood: (foodItem: FoodItem) => void;
  onDeleteFood: (foodItemId: string) => void;
  ai: GoogleGenAI;
}

// FIX: Implemented the main Dashboard component and its functionality.

// Helper to calculate BMR using Mifflin-St Jeor equation
const calculateBMR = (profile: UserProfile): number => {
    const { weight, height, age, gender } = profile;
    if (gender === Gender.Male) {
        return 10 * weight + 6.25 * height - 5 * age + 5;
    }
    return 10 * weight + 6.25 * height - 5 * age - 161;
};

// Helper to calculate daily calorie target
const calculateDailyCalories = (profile: UserProfile): number => {
    const bmr = calculateBMR(profile);
    const tdee = bmr * ACTIVITY_FACTORS[profile.activityLevel as ActivityLevel];
    const goalAdjustment = GOAL_ADJUSTMENTS[profile.goal as Goal];
    
    if(profile.goal === Goal.Lose && profile.targetWeight && profile.weight > profile.targetWeight && profile.loseWeightWeeks && profile.loseWeightWeeks > 0) {
      const weightToLose = profile.weight - profile.targetWeight;
      const weeklyDeficit = (weightToLose * 7700) / profile.loseWeightWeeks;
      const dailyDeficit = weeklyDeficit / 7;
      return Math.round(tdee - dailyDeficit);
    }

    return Math.round(tdee + goalAdjustment);
};

// Helper to calculate macro targets (e.g., 40% carbs, 30% protein, 30% fat)
const calculateMacros = (calories: number) => {
    return {
        protein: Math.round((calories * 0.30) / 4), // 4 calories per gram
        carbs: Math.round((calories * 0.40) / 4),
        fat: Math.round((calories * 0.30) / 9), // 9 calories per gram
    };
};

const Dashboard: React.FC<DashboardProps> = ({ userProfile, onUpdateProfile, onAddFood, onUpdateFood, onDeleteFood, ai }) => {
    const [isManualLogOpen, setManualLogOpen] = useState(false);
    const [isImageLogOpen, setImageLogOpen] = useState(false);
    const [isUpdateGoalOpen, setUpdateGoalOpen] = useState(false);
    const [isUpdateProfileOpen, setUpdateProfileOpen] = useState(false);
    const [isAppleHealthInfoOpen, setAppleHealthInfoOpen] = useState(false);
    const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);

    const dailyCalorieTarget = useMemo(() => calculateDailyCalories(userProfile), [userProfile]);
    const macroTargets = useMemo(() => calculateMacros(dailyCalorieTarget), [dailyCalorieTarget]);

    const today = new Date().toISOString().split('T')[0];
    const todaysLog = useMemo(() => (userProfile.foodLog || []).filter(item => item.timestamp.startsWith(today)), [userProfile.foodLog]);

    const totals = useMemo(() => {
        return todaysLog.reduce((acc, item) => ({
            calories: acc.calories + item.calories,
            protein: acc.protein + item.protein,
            carbs: acc.carbs + item.carbs,
            fat: acc.fat + item.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }, [todaysLog]);

    const handleAddFoodWithId = (foodItems: Omit<FoodItem, 'id'>[]) => {
      const itemsWithId = foodItems.map(item => ({...item, id: `${new Date().toISOString()}-${Math.random()}`}));
      onAddFood(itemsWithId);
    }
    
    const handleUpdateFoodWithId = (foodItem: FoodItem) => {
        onUpdateFood(foodItem);
        setEditingFoodItem(null);
    }

    const ProgressCircle: React.FC<{ value: number; total: number; label: string; unit: string; color: string }> = ({ value, total, label, unit, color }) => {
        const percentage = total > 0 ? Math.min((value / total) * 100, 100) : 0;
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="flex flex-col items-center text-center">
                <div className="relative w-28 h-28">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-slate-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle
                            className={color}
                            strokeWidth="10"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-slate-800">{Math.round(value)}</span>
                        <span className="text-xs text-slate-500">/ {Math.round(total)}{unit}</span>
                    </div>
                </div>
                <span className="mt-2 font-semibold text-slate-600">{label}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">סיכום יומי</h2>
                            <p className="text-slate-500">התקדמות הצריכה שלך להיום</p>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setUpdateProfileOpen(true)} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition" title="ערוך פרופיל">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                            <button onClick={() => setUpdateGoalOpen(true)} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition" title="עדכן יעדים">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
                        <ProgressCircle value={totals.calories} total={dailyCalorieTarget} label="קלוריות" unit="" color="text-primary-500" />
                        <ProgressCircle value={totals.protein} total={macroTargets.protein} label="חלבון" unit="ג'" color="text-red-500" />
                        <ProgressCircle value={totals.carbs} total={macroTargets.carbs} label="פחמימות" unit="ג'" color="text-yellow-500" />
                        <ProgressCircle value={totals.fat} total={macroTargets.fat} label="שומן" unit="ג'" color="text-blue-500" />
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                     <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-slate-800">הוספת ארוחה</h2>
                        <button onClick={() => setAppleHealthInfoOpen(true)} className="text-sm text-primary-600 hover:underline">
                            איך מתחברים ל-Apple Health?
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => setManualLogOpen(true)} className="w-full text-center p-6 bg-primary-50 hover:bg-primary-100 rounded-lg transition border-2 border-dashed border-primary-200">
                             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-primary-600"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            <span className="font-semibold text-primary-700">הוספה ידנית</span>
                            <p className="text-sm text-primary-600">כתוב מה אכלת</p>
                        </button>
                         <button onClick={() => setImageLogOpen(true)} className="w-full text-center p-6 bg-green-50 hover:bg-green-100 rounded-lg transition border-2 border-dashed border-green-200">
                           <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 text-green-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            <span className="font-semibold text-green-700">הוספה מתמונה</span>
                             <p className="text-sm text-green-600">צלם את הארוחה שלך</p>
                        </button>
                    </div>
                </div>
            </Card>

            <Card>
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">יומן אכילה יומי</h2>
                    {todaysLog.length > 0 ? (
                        <ul className="space-y-3">
                            {todaysLog.map((item) => (
                                <li key={item.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-700">{item.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {item.calories} קל' &bull; {item.protein}ח' &bull; {item.carbs}פ' &bull; {item.fat}ש'
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingFoodItem(item)} className="p-2 text-slate-400 hover:text-blue-500" title="ערוך פריט">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                        </button>
                                        <button onClick={() => onDeleteFood(item.id)} className="p-2 text-slate-400 hover:text-red-500" title="מחק פריט">
                                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
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
            <ManualLogModal 
                isOpen={isManualLogOpen} 
                onClose={() => setManualLogOpen(false)} 
                onLog={handleAddFoodWithId}
                ai={ai} 
            />
            <ImageLogModal
                isOpen={isImageLogOpen} 
                onClose={() => setImageLogOpen(false)} 
                onLog={handleAddFoodWithId} 
                ai={ai}
            />
            <UpdateGoalModal
                isOpen={isUpdateGoalOpen}
                onClose={() => setUpdateGoalOpen(false)}
                onUpdate={onUpdateProfile}
                userProfile={userProfile}
            />
            <UpdateProfileModal
                isOpen={isUpdateProfileOpen}
                onClose={() => setUpdateProfileOpen(false)}
                onUpdate={onUpdateProfile}
                userProfile={userProfile}
            />
            {editingFoodItem && (
                 <UpdateTimelineModal
                    isOpen={!!editingFoodItem}
                    onClose={() => setEditingFoodItem(null)}
                    onUpdate={handleUpdateFoodWithId}
                    onDelete={onDeleteFood}
                    foodItem={editingFoodItem}
                 />
            )}
            <AppleHealthInfoModal 
                isOpen={isAppleHealthInfoOpen}
                onClose={() => setAppleHealthInfoOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
