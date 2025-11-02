import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, FoodItem, ModalType, WeightEntry } from './types';
import useLocalStorage from './hooks/useLocalStorage';

import Header from './components/Header';
import Footer from './components/common/Footer';
import UserSelection from './components/UserSelection';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ManualLogModal from './components/ManualLogModal';
import ImageLogModal from './components/ImageLogModal';
import UpdateProfileModal from './components/UpdateProfileModal';
import UpdateTimelineModal from './components/UpdateTimelineModal';
import QuickAddModal from './components/QuickAddModal';

// Simple ID generator to avoid external dependencies
const simpleId = () => `id_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;

const App: React.FC = () => {
    // State
    const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('calorific-profiles', []);
    const [activeProfileId, setActiveProfileId] = useLocalStorage<string | null>('calorific-active-profile-id', null);
    
    // Food logs are stored per profile ID, keyed by date string YYYY-MM-DD
    const [foodLogs, setFoodLogs] = useLocalStorage<Record<string, Record<string, FoodItem[]>>>('calorific-food-logs-v3', {});

    const [isOnboarding, setIsOnboarding] = useState(false);
    
    // Centralized modal state
    const [activeModal, setActiveModal] = useState<ModalType | null>(null);
    const [itemToEdit, setItemToEdit] = useState<FoodItem | null>(null);

    // Date state for history view
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Gemini AI Instance
    const ai = useMemo(() => {
        return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    }, []);

    // Derived State
    const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

    const selectedDateKey = selectedDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format

    const activeFoodLog = useMemo(() => {
        if (!activeProfile) return [];
        return foodLogs[activeProfile.id]?.[selectedDateKey] || [];
    }, [activeProfile, foodLogs, selectedDateKey]);


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
        const newProfile: UserProfile = { ...profileData, id: simpleId(), weightLog: [{ date: new Date().toLocaleDateString('en-CA'), weight: profileData.weight }] };
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
        
        const dateKey = new Date().toLocaleDateString('en-CA');

        const newItems: FoodItem[] = items.map(item => ({
            ...item,
            id: simpleId(),
            timestamp: new Date().toISOString()
        }));

        const profileLogs = foodLogs[activeProfileId] || {};
        const currentLog = profileLogs[dateKey] || [];
        
        const updatedLog = [...currentLog, ...newItems].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setFoodLogs({ 
            ...foodLogs, 
            [activeProfileId]: {
                ...profileLogs,
                [dateKey]: updatedLog
            } 
        });
    };
    
    const handleUpdateTimelineItem = (updatedItem: FoodItem) => {
        if (!activeProfileId) return;
        const dateKey = new Date(updatedItem.timestamp).toLocaleDateString('en-CA');
        const profileLogs = foodLogs[activeProfileId] || {};
        const logForDate = profileLogs[dateKey] || [];
        
        const updatedLog = logForDate.map(item => item.id === updatedItem.id ? updatedItem : item);
        
        setFoodLogs({ 
            ...foodLogs, 
            [activeProfileId]: {
                ...profileLogs,
                [dateKey]: updatedLog
            } 
        });
        setActiveModal(null);
        setItemToEdit(null);
    };

    const handleDeleteTimelineItem = (itemId: string) => {
        if (!activeProfileId) return;
        const dateKey = new Date(itemToEdit!.timestamp).toLocaleDateString('en-CA');
        const profileLogs = foodLogs[activeProfileId] || {};
        const logForDate = profileLogs[dateKey] || [];

        const updatedLog = logForDate.filter(item => item.id !== itemId);
        setFoodLogs({ 
            ...foodLogs, 
            [activeProfileId]: {
                ...profileLogs,
                [dateKey]: updatedLog
            } 
        });
        setActiveModal(null);
        setItemToEdit(null);
    };

    const handleAddWeight = (weight: number) => {
        if (!activeProfile) return;
        const todayStr = new Date().toLocaleDateString('en-CA');
        
        const newEntry: WeightEntry = { date: todayStr, weight };
        
        const updatedLog = activeProfile.weightLog ? [...activeProfile.weightLog.filter(e => e.date !== todayStr), newEntry] : [newEntry];
        updatedLog.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        handleUpdateProfile({ weight, weightLog: updatedLog });
    };

    const handleUpdateGoalTimeline = (weeks: number) => {
        if (!activeProfile) return;
        handleUpdateProfile({ loseWeightWeeks: weeks });
        setActiveModal(null);
    };

    const openEditModal = (item: FoodItem) => {
        setItemToEdit(item);
        setActiveModal('updateTimeline');
    }

    // Render Logic
    const renderContent = () => {
        if (activeProfile) {
            return <Dashboard 
                userProfile={activeProfile}
                foodLog={activeFoodLog}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setActiveModal={setActiveModal}
                onEditItem={openEditModal}
                onAddWeight={handleAddWeight}
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
            <main className="flex-grow container mx-auto p-4 max-w-5xl">
                {renderContent()}
            </main>
            <Footer />
            
            {/* Modals */}
            <ManualLogModal 
                isOpen={activeModal === 'manualLog'}
                onClose={() => setActiveModal(null)}
                onLog={handleLogFoodItems}
                ai={ai}
            />
            <ImageLogModal
                isOpen={activeModal === 'imageLog'}
                onClose={() => setActiveModal(null)}
                onLog={handleLogFoodItems}
                ai={ai}
            />
            <QuickAddModal
                isOpen={activeModal === 'quickAdd'}
                onClose={() => setActiveModal(null)}
                onLog={handleLogFoodItems}
            />
            {activeProfile && (
                <>
                    <UpdateProfileModal
                         isOpen={activeModal === 'updateProfile'}
                         onClose={() => setActiveModal(null)}
                         onUpdate={handleUpdateProfile}
                         userProfile={activeProfile}
                    />
                    <UpdateTimelineModal
                        isOpen={activeModal === 'updateTimeline' && !!itemToEdit}
                        onClose={() => {
                            setActiveModal(null)
                            setItemToEdit(null)
                        }}
                        onUpdate={handleUpdateGoalTimeline}
                        userProfile={activeProfile}
                    />
                </>
            )}
             {itemToEdit && (
                <UpdateTimelineModal
                    isOpen={activeModal === 'updateTimeline'}
                    onClose={() => {
                        setActiveModal(null);
                        setItemToEdit(null);
                    }}
                    onUpdate={handleUpdateTimelineItem}
                    onDelete={handleDeleteTimelineItem}
                    foodItem={itemToEdit}
                />
            )}
        </div>
    );
}

export default App;
