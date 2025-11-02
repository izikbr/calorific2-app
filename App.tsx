import React, { useState, useMemo } from 'react';
// FIX: Implement the main App component, managing state, user profiles, and UI flow.
import { GoogleGenAI } from '@google/genai';
import { UserProfile, FoodItem, Gender, ActivityLevel, Goal } from './types';
import useLocalStorage from './hooks/useLocalStorage';

import Header from './components/Header';
import Footer from './components/common/Footer';
import UserSelection from './components/UserSelection';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ManualLogModal from './components/ManualLogModal';
import ImageLogModal from './components/ImageLogModal';
import UpdateGoalModal from './components/UpdateGoalModal';
import UpdateProfileModal from './components/UpdateProfileModal';
import UpdateTimelineModal from './components/UpdateTimelineModal';
import AppleHealthInfoModal from './components/AppleHealthInfoModal';
import { ACTIVITY_FACTORS, GOAL_ADJUSTMENTS } from './constants';

// Simple ID generator to avoid external dependencies
const simpleId = () => `id_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

const App: React.FC = () => {
    // State
    const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('calorific-profiles', []);
    const [activeProfileId, setActiveProfileId] = useLocalStorage<string | null>('calorific-active-profile-id', null);
    
    // Food logs are stored per profile ID, keyed by date string YYYY-MM-DD
    const [foodLogs, setFoodLogs] = useLocalStorage<Record<string, Record<string, FoodItem[]>>>('calorific-food-logs-v2', {});

    const [isOnboarding, setIsOnboarding] = useState(false);
    
    // Modal states
    const [isManualLogOpen, setManualLogOpen] = useState(false);
    const [isImageLogOpen, setImageLogOpen] = useState(false);
    const [isUpdateGoalOpen, setUpdateGoalOpen] = useState(false);
    const [isUpdateProfileOpen, setUpdateProfileOpen] = useState(false);
    const [isAppleHealthInfoOpen, setAppleHealthInfoOpen] = useState(false);
    const [timelineItemToUpdate, setTimelineItemToUpdate] = useState<FoodItem | null>(null);

    // Gemini AI Instance
    const ai = useMemo(() => {
        // FIX: Initialize GoogleGenAI client according to coding guidelines.
        return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }, []);

    // Derived State
    const activeProfile = profiles.find(p => p.id === activeProfileId) || null;
    const todayKey = new Date().toISOString().split('T')[0];
    const activeFoodLog = activeProfile ? (foodLogs[activeProfile.id]?.[todayKey] || []) : [];


    const dailyCalorieGoal = useMemo(() => {
        if (!activeProfile) return 2000;
        const { gender, weight, height, age, activityLevel, goal, loseWeightWeeks, targetWeight } = activeProfile;
        
        // Harris-Benedict BMR Calculation
        let bmr;
        if (gender === Gender.Male) {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        const tdee = bmr * (ACTIVITY_FACTORS[activityLevel] || 1.55);

        if (goal === Goal.Lose && loseWeightWeeks && targetWeight && loseWeightWeeks > 0) {
            const weightToLose = weight - targetWeight;
            if (weightToLose > 0) {
                const weeklyDeficit = (weightToLose * 7700) / loseWeightWeeks;
                return Math.max(1200, tdee - (weeklyDeficit / 7)); // Ensure goal is not dangerously low
            }
        }
        
        return tdee + (GOAL_ADJUSTMENTS[goal] || 0);
    }, [activeProfile]);


    // Handlers
    const handleSelectProfile = (id: string) => {
        setActiveProfileId(id);
        setIsOnboarding(false);
    };

    const handleNewProfile = () => {
        setActiveProfileId(null);
        setIsOnboarding(true);
    };

    const handleLogout = () => {
        setActiveProfileId(null);
        setIsOnboarding(false);
    };

    const handleOnboardingComplete = (profileData: Omit<UserProfile, 'id'>) => {
        const newProfile: UserProfile = { ...profileData, id: simpleId() };
        const newProfiles = [...profiles, newProfile];
        setProfiles(newProfiles);
        setActiveProfileId(newProfile.id);
        setIsOnboarding(false);
    };

    const handleDeleteProfile = (id: string) => {
        if (window.confirm("האם למחוק פרופיל זה לצמיתות? לא ניתן לשחזר פעולה זו.")) {
            setProfiles(profiles.filter(p => p.id !== id));
            if (activeProfileId === id) {
                setActiveProfileId(null);
            }
            const newLogs = { ...foodLogs };
            delete newLogs[id];
            setFoodLogs(newLogs);
        }
    };
    
    const handleUpdateProfile = (updatedData: Partial<UserProfile>) => {
        if (!activeProfileId) return;
        setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, ...updatedData } : p));
    };
    
    const handleLogFoodItems = (items: Omit<FoodItem, 'id' | 'timestamp'>[]) => {
        if (!activeProfileId) return;

        const newItems: FoodItem[] = items.map(item => ({
            ...item,
            id: simpleId(),
            timestamp: new Date().toISOString()
        }));

        const profileLogs = foodLogs[activeProfileId] || {};
        const todayLog = profileLogs[todayKey] || [];
        
        const updatedTodayLog = [...todayLog, ...newItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setFoodLogs({ 
            ...foodLogs, 
            [activeProfileId]: {
                ...profileLogs,
                [todayKey]: updatedTodayLog
            } 
        });
    };
    
    const handleUpdateTimelineItem = (updatedItem: FoodItem) => {
        if (!activeProfileId) return;
        const updatedLog = activeFoodLog.map(item => item.id === updatedItem.id ? updatedItem : item);
        
        const profileLogs = foodLogs[activeProfileId] || {};
        setFoodLogs({ 
            ...foodLogs, 
            [activeProfileId]: {
                ...profileLogs,
                [todayKey]: updatedLog
            } 
        });
        setTimelineItemToUpdate(null);
    };

    const handleDeleteTimelineItem = (itemId: string) => {
        if (!activeProfileId) return;
        const updatedLog = activeFoodLog.filter(item => item.id !== itemId);
         const profileLogs = foodLogs[activeProfileId] || {};
        setFoodLogs({ 
            ...foodLogs, 
            [activeProfileId]: {
                ...profileLogs,
                [todayKey]: updatedLog
            } 
        });
    };

    // Render Logic
    const renderContent = () => {
        if (activeProfile) {
            return <Dashboard 
                userProfile={activeProfile}
                foodLog={activeFoodLog}
                dailyCalorieGoal={dailyCalorieGoal}
                onOpenManualLog={() => setManualLogOpen(true)}
                onOpenImageLog={() => setImageLogOpen(true)}
                onOpenUpdateGoal={() => setUpdateGoalOpen(true)}
                onOpenUpdateProfile={() => setUpdateProfileOpen(true)}
                onOpenUpdateTimeline={setTimelineItemToUpdate}
                onOpenAppleHealthInfo={() => setAppleHealthInfoOpen(true)}
            />;
        }
        if (isOnboarding) {
            return <Onboarding onComplete={handleOnboardingComplete} />;
        }
        return <UserSelection 
            profiles={profiles}
            onSelectProfile={handleSelectProfile}
            onDeleteProfile={handleDeleteProfile}
            onNewProfile={handleNewProfile}
        />;
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans" dir="rtl">
            <Header userProfile={activeProfile} onLogout={handleLogout} />
            <main className="flex-grow container mx-auto p-4 max-w-4xl">
                {renderContent()}
            </main>
            <Footer />
            
            {/* Modals */}
            <ManualLogModal 
                isOpen={isManualLogOpen}
                onClose={() => setManualLogOpen(false)}
                onLog={handleLogFoodItems}
                ai={ai}
            />
            <ImageLogModal
                isOpen={isImageLogOpen}
                onClose={() => setImageLogOpen(false)}
                onLog={handleLogFoodItems}
                ai={ai}
            />
            {activeProfile && (
                <>
                    <UpdateGoalModal
                        isOpen={isUpdateGoalOpen}
                        onClose={() => setUpdateGoalOpen(false)}
                        onUpdate={handleUpdateProfile}
                        userProfile={activeProfile}
                    />
                    <UpdateProfileModal
                        isOpen={isUpdateProfileOpen}
                        onClose={() => setUpdateProfileOpen(false)}
                        onUpdate={handleUpdateProfile}
                        userProfile={activeProfile}
                    />
                </>
            )}
             {timelineItemToUpdate && (
                <UpdateTimelineModal
                    isOpen={!!timelineItemToUpdate}
                    onClose={() => setTimelineItemToUpdate(null)}
                    onUpdate={handleUpdateTimelineItem}
                    onDelete={handleDeleteTimelineItem}
                    foodItem={timelineItemToUpdate}
                />
            )}
            <AppleHealthInfoModal 
                isOpen={isAppleHealthInfoOpen}
                onClose={() => setAppleHealthInfoOpen(false)}
            />
        </div>
    );
}

export default App;
