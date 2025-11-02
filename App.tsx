import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, FoodItem, ModalType, WeightEntry } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import UserSelection from './components/UserSelection';
import Onboarding from './components/Onboarding';
import ImageLogModal from './components/ImageLogModal';
import ManualLogModal from './components/ManualLogModal';
import Footer from './components/common/Footer';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('he');

function App() {
  const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('caloric-profiles', []);
  const [activeProfileId, setActiveProfileId] = useLocalStorage<string | null>('caloric-active-profile', null);
  const [foodLogs, setFoodLogs] = useLocalStorage<Record<string, FoodItem[]>>('caloric-food-logs', {});
  const [weightLogs, setWeightLogs] = useLocalStorage<Record<string, WeightEntry[]>>('caloric-weight-logs', {});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const ai = useMemo(() => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId), [profiles, activeProfileId]);
  
  const currentFoodLog = useMemo(() => {
    if (!activeProfileId) return [];
    const userLog = foodLogs[activeProfileId] || [];
    const startOfDay = dayjs(selectedDate).startOf('day');
    const endOfDay = dayjs(selectedDate).endOf('day');
    return userLog.filter(item => {
        const itemDate = dayjs(item.timestamp);
        return itemDate.isAfter(startOfDay) && itemDate.isBefore(endOfDay);
    });
  }, [foodLogs, activeProfileId, selectedDate]);

  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    setShowOnboarding(false);
  };
  
  const handleCreateProfile = (profileData: Omit<UserProfile, 'id'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: Date.now().toString(),
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    setShowOnboarding(false);
  };
  
  const handleDeleteProfile = (id: string) => {
    if (window.confirm("האם למחוק את הפרופיל וכל הנתונים שלו?")) {
      setProfiles(profiles.filter(p => p.id !== id));
      
      const newFoodLogs = { ...foodLogs };
      delete newFoodLogs[id];
      setFoodLogs(newFoodLogs);

      const newWeightLogs = { ...weightLogs };
      delete newWeightLogs[id];
      setWeightLogs(newWeightLogs);

      if (activeProfileId === id) {
        setActiveProfileId(null);
      }
    }
  };
  
  const handleLogout = () => {
    setActiveProfileId(null);
  };

  const handleAddFood = (food: FoodItem | FoodItem[]) => {
    if (!activeProfileId) return;
    const itemsToAdd = Array.isArray(food) ? food : [food];
    const userLog = foodLogs[activeProfileId] || [];
    setFoodLogs({
      ...foodLogs,
      [activeProfileId]: [...userLog, ...itemsToAdd],
    });
    if(modal) setModal(null);
  };
  
  const handleRemoveFood = (timestamp: string) => {
    if (!activeProfileId) return;
    const userLog = foodLogs[activeProfileId] || [];
    setFoodLogs({
      ...foodLogs,
      [activeProfileId]: userLog.filter(item => item.timestamp !== timestamp),
    });
  };

  const handleAddWeight = (weight: number) => {
    if (!activeProfileId) return;

    // 1. Update the weight log
    const today = dayjs().format('YYYY-MM-DD');
    const userWeightLog = weightLogs[activeProfileId] || [];
    const existingEntryIndex = userWeightLog.findIndex(entry => entry.date === today);

    let updatedLog;
    if (existingEntryIndex !== -1) {
      updatedLog = [...userWeightLog];
      updatedLog[existingEntryIndex] = { date: today, weight };
    } else {
      updatedLog = [...userWeightLog, { date: today, weight }];
    }
    setWeightLogs({ ...weightLogs, [activeProfileId]: updatedLog });

    // 2. Update the active profile's current weight
    setProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === activeProfileId ? { ...p, weight: weight } : p
      )
    );
  };


  const renderContent = () => {
    if (showOnboarding) {
      return <Onboarding onComplete={handleCreateProfile} />;
    }

    if (activeProfile && ai) {
      return (
        <Dashboard
          userProfile={activeProfile}
          foodLog={currentFoodLog}
          weightLog={weightLogs[activeProfile.id] || []}
          onAddFood={handleAddFood}
          onRemoveFood={handleRemoveFood}
          onAddWeight={handleAddWeight}
          setModal={setModal}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      );
    }

    return (
      <UserSelection
        profiles={profiles}
        onSelectProfile={handleSelectProfile}
        onDeleteProfile={handleDeleteProfile}
        onNewProfile={() => setShowOnboarding(true)}
      />
    );
  }
  
   if (!ai) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
           <h2 className="text-xl font-bold mb-2">שגיאת הגדרה</h2>
           <p>מפתח ה-API של Gemini אינו מוגדר. אנא הגדר את משתנה הסביבה API_KEY.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <Header userProfile={activeProfile || null} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto max-w-4xl p-4 sm:p-6">
        {renderContent()}
      </main>
      <Footer />
      
      {ai && (
        <>
          <ImageLogModal
            isOpen={modal === 'image'}
            onClose={() => setModal(null)}
            onAddFood={handleAddFood}
            ai={ai}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
          
          <ManualLogModal
            isOpen={modal === 'manual'}
            onClose={() => setModal(null)}
            onAddFood={handleAddFood}
            ai={ai}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </>
      )}
    </div>
  );
}

export default App;