import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import useLocalStorage from './hooks/useLocalStorage';
import { UserProfile, FoodItem } from './types';
import Onboarding from './components/Onboarding';
import UserSelection from './components/UserSelection';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Footer from './components/common/Footer';

// FIX: Initialized the main App component, handling user profiles, state, and Gemini AI client setup.
const App: React.FC = () => {
  const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('calorific-profiles', []);
  const [activeProfileId, setActiveProfileId] = useLocalStorage<string | null>('calorific-active-profile', null);
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Initialize the Google AI client.
  // IMPORTANT: The API key is sourced from environment variables.
  // Do not add any UI for managing the API key.
  const ai = useMemo(() => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable is not set.");
        // Return a mock/dummy object or null to prevent crashing,
        // and show an error message to the user.
        return null; 
    }
    // FIX: Initialize GoogleGenAI with a named apiKey parameter as required by the new API.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }, []);

  const activeProfile = useMemo(() => {
    return profiles.find(p => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  const handleCreateProfile = (profileData: Omit<UserProfile, 'id'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: new Date().toISOString(),
      foodLog: [],
    };
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    setIsOnboarding(false);
  };

  const handleUpdateProfile = (updatedData: Partial<UserProfile>) => {
    if (!activeProfileId) return;
    const updatedProfiles = profiles.map(p =>
      p.id === activeProfileId ? { ...p, ...updatedData } : p
    );
    setProfiles(updatedProfiles);
  };
  
  const handleDeleteProfile = (id: string) => {
      if(window.confirm("האם למחוק את הפרופיל? לא ניתן לשחזר פעולה זו.")){
          const updatedProfiles = profiles.filter(p => p.id !== id);
          setProfiles(updatedProfiles);
          if (activeProfileId === id) {
              setActiveProfileId(null);
          }
      }
  };

  const handleLogout = () => {
    setActiveProfileId(null);
  };

  const handleAddFood = (foodItems: FoodItem[]) => {
      if (!activeProfileId) return;
      const updatedProfiles = profiles.map(p => {
          if (p.id === activeProfileId) {
              return {
                  ...p,
                  foodLog: [...(p.foodLog || []), ...foodItems],
              };
          }
          return p;
      });
      setProfiles(updatedProfiles);
  };
  
  const handleUpdateFood = (updatedFoodItem: FoodItem) => {
      if (!activeProfileId || !updatedFoodItem.id) return;
      const updatedProfiles = profiles.map(p => {
          if (p.id === activeProfileId) {
              const updatedLog = (p.foodLog || []).map(item => 
                  item.id === updatedFoodItem.id ? updatedFoodItem : item
              );
              return { ...p, foodLog: updatedLog };
          }
          return p;
      });
      setProfiles(updatedProfiles);
  };
  
  const handleDeleteFood = (foodItemId: string) => {
      if (!activeProfileId) return;
      const updatedProfiles = profiles.map(p => {
          if (p.id === activeProfileId) {
              const updatedLog = (p.foodLog || []).filter(item => item.id !== foodItemId);
              return { ...p, foodLog: updatedLog };
          }
          return p;
      });
      setProfiles(updatedProfiles);
  }

  if (!ai) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-red-600">שגיאת הגדרות</h1>
                <p className="text-slate-600 mt-2">מפתח ה-API של Gemini אינו מוגדר. יש להגדיר את משתנה הסביבה API_KEY.</p>
            </div>
        </div>
    );
  }

  const renderContent = () => {
    if (activeProfile) {
      return (
        <Dashboard
          userProfile={activeProfile}
          onUpdateProfile={handleUpdateProfile}
          onAddFood={handleAddFood}
          onUpdateFood={handleUpdateFood}
          onDeleteFood={handleDeleteFood}
          ai={ai}
        />
      );
    }
    if (isOnboarding) {
      return <Onboarding onComplete={handleCreateProfile} />;
    }
    return (
      <UserSelection
        profiles={profiles}
        onSelectProfile={setActiveProfileId}
        onDeleteProfile={handleDeleteProfile}
        onNewProfile={() => setIsOnboarding(true)}
      />
    );
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header userProfile={activeProfile} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto p-4 max-w-4xl">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;
