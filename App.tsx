import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, FoodItem, ModalType } from './types';
import useLocalStorage from './hooks/useLocalStorage';

import Header from './components/Header';
import UserSelection from './components/UserSelection';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ImageLogModal from './components/ImageLogModal';
import ManualLogModal from './components/ManualLogModal';
import Footer from './components/common/Footer';

const App: React.FC = () => {
  const [profiles, setProfiles] = useLocalStorage<UserProfile[]>('calorik-profiles', []);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const foodLogKey = useMemo(() => selectedProfile ? `calorik-foodlog-${selectedProfile.id}-${today}` : '', [selectedProfile, today]);
  
  const [foodLog, setFoodLog] = useLocalStorage<FoodItem[]>(foodLogKey, []);

  const [modal, setModal] = useState<ModalType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appState, setAppState] = useState<'selecting' | 'onboarding' | 'dashboard'>('selecting');

  // FIX: Initialize Gemini AI client. API_KEY is expected to be in environment variables.
  const ai = useMemo(() => new GoogleGenAI({apiKey: process.env.API_KEY as string}), []);

  useEffect(() => {
    if (selectedProfile) {
      setAppState('dashboard');
    } else if (profiles.length > 0) {
      setAppState('selecting');
    } else {
      setAppState('onboarding');
    }
  }, [selectedProfile, profiles]);

  const handleSelectUser = (user: UserProfile) => {
    setSelectedProfile(user);
  };

  const handleLogout = () => {
    setSelectedProfile(null);
  };
  
  const handleShowOnboarding = () => {
      setAppState('onboarding');
  }

  const handleOnboardingComplete = (profileData: Omit<UserProfile, 'id'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: new Date().getTime().toString(),
    };
    setProfiles(prev => [...prev, newProfile]);
    setSelectedProfile(newProfile);
  };

  const handleAddFood = (itemOrItems: FoodItem | FoodItem[]) => {
    const itemsToAdd = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
    setFoodLog(prev => [...prev, ...itemsToAdd]);
    if(modal) {
       setModal(null);
    }
  };

  const handleRemoveFood = (timestamp: string) => {
    setFoodLog(prev => prev.filter(item => item.timestamp !== timestamp));
  };
  
  const renderContent = () => {
      switch(appState) {
          case 'dashboard':
            return selectedProfile && <Dashboard 
                userProfile={selectedProfile} 
                foodLog={foodLog}
                onAddFood={handleAddFood}
                onRemoveFood={handleRemoveFood}
                setModal={setModal}
            />;
          case 'onboarding':
            return <Onboarding onComplete={handleOnboardingComplete} />;
          case 'selecting':
          default:
            return <UserSelection 
                users={profiles}
                onSelectUser={handleSelectUser}
                onAddNewUser={handleShowOnboarding}
            />
      }
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans text-slate-800">
      <Header userProfile={selectedProfile} onLogout={handleLogout} />
      <main className="flex-grow container mx-auto max-w-4xl p-4 sm:p-6">
        {renderContent()}
      </main>
      
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
      <Footer />
    </div>
  );
};

export default App;
