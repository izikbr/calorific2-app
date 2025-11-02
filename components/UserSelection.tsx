import React from 'react';
import { UserProfile } from '../types';
import Card from './common/Card';

interface UserSelectionProps {
  users: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onAddNewUser: () => void;
}

const UserSelection: React.FC<UserSelectionProps> = ({ users, onSelectUser, onAddNewUser }) => {
  return (
    <Card>
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">ברוכים השבים ל-קלוריק!</h1>
        <p className="text-slate-500 mb-8">מי משתמש באפליקציה היום?</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {users.map(user => (
            <div key={user.id} onClick={() => onSelectUser(user)} className="cursor-pointer group flex flex-col items-center p-4 border border-transparent rounded-lg hover:bg-primary-50 hover:border-primary-200 transition">
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mb-3 group-hover:bg-primary-200 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user text-slate-500 group-hover:text-primary-600 transition"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              <span className="font-semibold text-slate-700 group-hover:text-primary-700 transition">{user.name}</span>
            </div>
          ))}
           <div onClick={onAddNewUser} className="cursor-pointer group flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition">
                 <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus text-slate-400 group-hover:text-primary-500 transition"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                 </div>
                 <span className="font-semibold text-slate-500 group-hover:text-primary-600 transition">משתמש חדש</span>
            </div>
        </div>
      </div>
    </Card>
  );
};

export default UserSelection;