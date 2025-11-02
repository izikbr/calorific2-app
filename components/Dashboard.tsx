import React from 'react';
import { UserProfile, FoodItem, ModalType, Gender, ActivityLevel, Goal } from '../types';
import { NutritionGoals } from '../types';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from '../constants';
import Card from './common/Card';
import dayjs from 'dayjs';

interface DashboardProps {
  userProfile: UserProfile;
  foodLog: FoodItem[];
  onAddFood: (food: FoodItem | FoodItem[]) => void;
  onRemoveFood: (timestamp: string) => void;
  setModal: (modal: ModalType) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

const calculateNutritionGoals = (profile: UserProfile): NutritionGoals => {
  const { gender, weight, height, age, activityLevel, goal } = profile;

  // Mifflin-St Jeor Equation for BMR
  let bmr: number;
  if (gender === Gender.Male) {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const activityFactor = ACTIVITY_FACTORS[activityLevel as ActivityLevel];
  const maintenanceCalories = bmr * activityFactor;
  
  const goalAdjustment = GOAL_ADJUSTMENTS[goal as Goal];
  const tdee = maintenanceCalories + goalAdjustment;

  // Macronutrient split (example: 40% carbs, 30% protein, 30% fat)
  const carbs = (tdee * 0.40) / 4; // 4 calories per gram
  const protein = (tdee * 0.30) / 4; // 4 calories per gram
  const fat = (tdee * 0.30) / 9; // 9 calories per gram

  // Calculate BMI
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);

  return { tdee, bmi, protein, carbs, fat };
};

const Dashboard: React.FC<DashboardProps> = ({ userProfile, foodLog, onRemoveFood, setModal, selectedDate, setSelectedDate }) => {
  const goals = calculateNutritionGoals(userProfile);
  const isToday = dayjs(selectedDate).isSame(dayjs(), 'day');

  const handleDateChange = (amount: number) => {
    setSelectedDate(dayjs(selectedDate).add(amount, 'day').toDate());
  };

  const formatDateDisplay = () => {
    if (isToday) return 'סיכום יומי';
    if (dayjs(selectedDate).isSame(dayjs().subtract(1, 'day'), 'day')) return 'סיכום מאתמול';
    return dayjs(selectedDate).format('DD/MM/YYYY');
  };

  const consumed = foodLog.reduce((acc, item) => {
    acc.calories += item.calories;
    acc.protein += item.protein;
    acc.carbs += item.carbs;
    acc.fat += item.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const renderProgressBar = (value: number, goal: number, label: string, unit: string) => {
    const percentage = goal > 0 ? (value / goal) * 100 : 0;
    const isOver = percentage > 100;
    return (
      <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-sm text-slate-500">
            {value.toFixed(0)} / <span className="font-medium text-slate-600">{goal.toFixed(0)}</span> {unit}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div 
            className={`h-2.5 rounded-full ${isOver ? 'bg-red-500' : 'bg-primary-600'}`} 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-500"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
            <h2 className="text-2xl font-bold text-slate-800 text-center">{formatDateDisplay()}</h2>
            <button onClick={() => handleDateChange(1)} disabled={isToday} className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-slate-500"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {renderProgressBar(consumed.calories, goals.tdee, 'קלוריות', 'קק"ל')}
            {renderProgressBar(consumed.protein, goals.protein, 'חלבון', 'ג')}
            {renderProgressBar(consumed.carbs, goals.carbs, 'פחמימות', 'ג')}
            {renderProgressBar(consumed.fat, goals.fat, 'שומן', 'ג')}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">הוספת ארוחה</h3>
          {isToday ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => setModal('image')} className="flex flex-col items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-primary-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span className="font-semibold text-slate-700">הוספה מתמונה</span>
              </button>
              <button onClick={() => setModal('manual')} className="flex flex-col items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-primary-600"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                <span className="font-semibold text-slate-700">הוספה ידנית</span>
              </button>
              <button onClick={() => setModal('appleHealthInfo')} className="flex flex-col items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition">
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-2 text-primary-600" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 4c2.76 0 5 2.24 5 5s-2.24 5 -5 5s-5 -2.24 -5 -5s2.24 -5 5 -5z" /><path d="M12 4c-4.42 0 -8 3.58 -8 8s3.58 8 8 8s8 -3.58 8 -8" /><path d="M12 4c0 4.42 3.58 8 8 8" /></svg>
                <span className="font-semibold text-slate-700">הפוך לאפליקציית iOS</span>
              </button>
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-100 rounded-lg">
                <p className="text-slate-600 font-medium">ניתן להוסיף אוכל רק ליום הנוכחי.</p>
                <p className="text-slate-500 text-sm">אתה צופה ביומן מתאריך {dayjs(selectedDate).format('DD/MM/YYYY')}.</p>
            </div>
          )}
        </div>
      </Card>
      
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">יומן אכילה ליום זה</h3>
          {foodLog.length > 0 ? (
            <ul className="space-y-3">
              {foodLog.map((item) => (
                <li key={item.timestamp} className="group flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{item.name}</p>
                    <p className="text-sm text-slate-500">
                      {item.calories.toFixed(0)} קק"ל | ח: {item.protein.toFixed(0)} | פ: {item.carbs.toFixed(0)} | ש: {item.fat.toFixed(0)}
                      <span className="mx-2 text-slate-300">|</span>
                      {dayjs(item.timestamp).format('HH:mm')}
                    </p>
                  </div>
                  <button 
                    onClick={() => onRemoveFood(item.timestamp)}
                    disabled={!isToday}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-0 transition-opacity p-2 -mr-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">לא נמצאו רישומים עבור יום זה.</p>
              {isToday && <p className="text-slate-400 text-sm mt-1">השתמש בכפתורים למעלה כדי להוסיף את הארוחה הראשונה שלך.</p>}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;