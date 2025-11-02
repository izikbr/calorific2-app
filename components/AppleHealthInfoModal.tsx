import React from 'react';

interface AppleHealthInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppleHealthInfoModal: React.FC<AppleHealthInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">חיבור ל-Apple Health</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-3xl leading-none">&times;</button>
          </div>
          <div className="text-slate-600 space-y-4">
            <p>
              כדי לסנכרן נתונים באופן אוטומטי מאפליקציית "בריאות" של אפל, נדרשת גרסת האפליקציה מחנות ה-App Store.
            </p>
            <p>
              התקנת האפליקציה מה-App Store תאפשר לנו לבקש את רשותך לקרוא נתונים כמו גובה, משקל ופעילות גופנית, ולעדכן את הפרופיל שלך באופן מאובטח ואוטומטי.
            </p>
            <p className="p-3 bg-slate-100 rounded-md text-sm">
              <strong>הערה:</strong> זוהי תכונה עתידית. כרגע, האפליקציה פועלת בדפדפן בלבד ואינה יכולה לגשת לנתונים אלו.
            </p>
          </div>
          <div className="mt-6 text-right">
            <button onClick={onClose} className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              הבנתי
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleHealthInfoModal;