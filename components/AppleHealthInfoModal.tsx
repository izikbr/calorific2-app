import React from 'react';

interface AppleHealthInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppleHealthInfoModal: React.FC<AppleHealthInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const codeBlockClass = "p-3 bg-slate-800 text-slate-100 rounded-md font-mono text-sm text-left dir-ltr overflow-x-auto whitespace-pre";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800">הפיכת האפליקציה לאפליקציית iOS</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl leading-none">&times;</button>
          </div>
          <div className="space-y-6 text-slate-600">
            <p>
              כדי להתחבר ל-Apple Health, עלינו "לעטוף" את אפליקציית הרשת הזו בתוך אפליקציה אמיתית שניתן להתקין מה-App Store. התהליך מתבצע באמצעות כלי שנקרא <strong>Capacitor</strong>.
            </p>
            <p className="font-semibold text-slate-700">בצע את השלבים הבאים בטרמינל במחשב Mac שלך, בתוך תיקיית הפרויקט:</p>
            
            <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">שלב 1: התקנת Capacitor</h3>
                <p className="mb-2">הרץ את הפקודה הבאה כדי להתקין את התלויות הנדרשות:</p>
                <div className={codeBlockClass}>
                    npm install @capacitor/core @capacitor/cli
                </div>
            </div>

             <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">שלב 2: אתחול הפרויקט</h3>
                <p className="mb-2">הרץ את פקודת האתחול. תתבקש למלא את שם האפליקציה ומזהה ייחודי (לדוגמה: com.izikbr.calorific).</p>
                <div className={codeBlockClass}>
                    npx cap init
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">שלב 3: הוספת פלטפורמת iOS</h3>
                <p className="mb-2">הרץ את הפקודות הבאות כדי להוסיף את פלטפורמת iOS לפרויקט ולסנכרן את קוד הרשת:</p>
                <div className={codeBlockClass}>
                    npm install @capacitor/ios
                    {'\n'}
                    npx cap add ios
                </div>
            </div>
            
            <div>
                <h3 className="font-semibold text-lg text-slate-700 mb-2">שלב 4: פתיחת הפרויקט ב-Xcode</h3>
                <p className="mb-2">לבסוף, פתח את פרויקט ה-iOS שנוצר בתוכנת Xcode. משם תוכל להמשיך להגדיר את החיבור ל-Apple Health ולהריץ את האפליקציה על סימולטור או מכשיר אמיתי.</p>
                <div className={codeBlockClass}>
                    npx cap open ios
                </div>
            </div>

          </div>
           <div className="mt-8 text-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
            >
              הבנתי, נמשיך משם
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppleHealthInfoModal;