import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import useLocalStorage from './hooks/useLocalStorage';
import { UserProfile, FoodItem } from './types';
import Onboarding from './components/Onboarding';
import UserSelection from './components/UserSelection';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Footer from './components/common/Footer';

// FIX: Initialized the main App component to manage state and render views.
const App: React.FC = () => {
  const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('calorific-profiles', []);
  const [currentProfileId, setCurrentProfileId] = useLocalStorage<string | null>('calorific-current-profile', null);
  const [foodLogs, setFoodLogs] = useLocalStorage<Record<string, FoodItem[]>>('calorific-food-logs', {});
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Initialize Gemini AI client
  const ai = useMemo(() => {
    if (process.env.API_KEY) {
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    console.error("API_KEY environment variable not set.");
    return null;
  }, []);

  const currentProfile = useMemo(() => {
    return profiles.find(p => p.id === currentProfileId) || null;
  }, [profiles, currentProfileId]);

  const currentFoodLog = useMemo(() => {
    if (!currentProfileId) return [];
    return foodLogs[currentProfileId] || [];
  }, [foodLogs, currentProfileId]);

  const handleCreateProfile = (profileData: Omit<UserProfile, 'id'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: `user_${new Date().getTime()}`,
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setCurrentProfileId(newProfile.id);
    setShowOnboarding(false);
  };

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    if (!currentProfileId) return;
    setProfiles(prevProfiles =>
      prevProfiles.map(p =>
        p.id === currentProfileId ? { ...p, ...updates } : p
      )
    );
  };
  
  const handleDeleteProfile = (id: string) => {
    if (window.confirm('Are you sure you want to delete this profile and all its data?')) {
      setProfiles(profiles.filter(p => p.id !== id));
      if (currentProfileId === id) {
        setCurrentProfileId(null);
      }
      // Also delete associated food log
      const newFoodLogs = {...foodLogs};
      delete newFoodLogs[id];
      setFoodLogs(newFoodLogs);
    }
  };

  const handleSelectProfile = (id: string) => {
    setCurrentProfileId(id);
  };

  const handleLogout = () => {
    setCurrentProfileId(null);
  };
  
  const handleNewProfile = () => {
      setShowOnboarding(true);
  };
  
  const handleLogFood = (items: Omit<FoodItem, 'id'>[]) => {
      if (!currentProfileId) return;

      const newItems: FoodItem[] = items.map(item => ({
        ...item,
        id: `food_${new Date().getTime()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
      }));

      setFoodLogs(prevLogs => ({
          ...prevLogs,
          [currentProfileId]: [...(prevLogs[currentProfileId] || []), ...newItems]
      }));
  };

  const handleDeleteFoodItem = (itemId: string) => {
      if(!currentProfileId) return;
      setFoodLogs(prevLogs => ({
          ...prevLogs,
          [currentProfileId]: prevLogs[currentProfileId].filter(item => item.id !== itemId)
      }));
  };
  
  const handleUpdateFoodItem = (updatedItem: FoodItem) => {
       if(!currentProfileId) return;
       setFoodLogs(prevLogs => ({
           ...prevLogs,
           [currentProfileId]: prevLogs[currentProfileId].map(item => item.id === updatedItem.id ? updatedItem : item)
       }));
  };
  
  if (!ai) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-red-600">Configuration Error</h1>
              <p className="text-slate-600 mt-2">The Gemini API key is missing. Please set the API_KEY environment variable.</p>
          </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentProfile) {
      return (
        <Dashboard
          userProfile={currentProfile}
          onUpdateProfile={handleUpdateProfile}
          foodLog={currentFoodLog}
          onLogFood={handleLogFood}
          onDeleteFoodItem={handleDeleteFoodItem}
          onUpdateFoodItem={handleUpdateFoodItem}
          ai={ai}
        />
      );
    }
    if (showOnboarding || profiles.length === 0) {
      return <Onboarding onComplete={handleCreateProfile} />;
    }
    return (
        <UserSelection 
            profiles={profiles} 
            onSelectProfile={handleSelectProfile} 
            onDeleteProfile={handleDeleteProfile}
            onNewProfile={handleNewProfile}
        />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header userProfile={currentProfile} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4 max-w-4xl">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
