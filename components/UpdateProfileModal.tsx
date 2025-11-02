import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Gender } from '../types';
import Card from './common/Card';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedProfile: Partial<UserProfile>) => void;
  userProfile: UserProfile;
}

// FIX: Implemented the UpdateProfileModal to allow editing basic user profile details.
const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({ isOpen, onClose, onUpdate, userProfile }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>(userProfile);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(userProfile);
    }
  }, [userProfile, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumericField = ['age', 'height'].includes(name);
    setFormData(prev => ({ ...prev, [name]: isNumericField ? Number(value) : value }));
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({...prev, avatar: reader.result as string}));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">עריכת פרופיל</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
                  <input type="file" accept="image/*" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" />
                  <div className="w-16 h-16 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                      {formData.avatar ? (
                          <img src={formData.avatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      )}
                  </div>
                  <div className="flex-grow">
                      <label className="block text-sm font-medium text-slate-600 mb-1">שם / כינוי</label>
                      <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required />
                  </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">גיל</label>
                <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">גובה (ס"מ)</label>
                <input type="number" name="height" value={formData.height || ''} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500" required min="1" />
              </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">מין</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value={Gender.Male}>זכר</option>
                <option value={Gender.Female}>נקבה</option>
              </select>
            </div>
           
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition">
                ביטול
              </button>
              <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition">
                שמור שינויים
              </button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default UpdateProfileModal;
