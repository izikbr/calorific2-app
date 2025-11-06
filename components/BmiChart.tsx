
import React from 'react';

interface BmiChartProps {
  bmi: number;
}

const BmiChart: React.FC<BmiChartProps> = ({ bmi }) => {
  const minBmi = 15;
  const maxBmi = 40;
  const range = maxBmi - minBmi;

  const getPositionPercentage = (value: number) => {
    const percentage = ((value - minBmi) / range) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const userBmiPosition = getPositionPercentage(bmi);

  const categories = [
    { name: 'תת משקל', color: 'bg-blue-400', end: 18.5 },
    { name: 'משקל תקין', color: 'bg-green-500', end: 25 },
    { name: 'עודף משקל', color: 'bg-amber-500', end: 30 },
    { name: 'השמנת יתר', color: 'bg-red-500', end: maxBmi },
  ];

  let lastEnd = minBmi;

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6">מדד מסת הגוף (BMI)</h3>
      <div className="relative w-full pt-10">
        {/* User's BMI Indicator */}
        <div
          className="absolute z-10 text-center transition-all duration-500 ease-out"
          style={{ left: `${userBmiPosition}%`, transform: 'translateX(-50%)', bottom: 'calc(100% - 30px)' }}
        >
          <span className="text-sm font-bold text-primary-600 bg-white px-2 py-1 rounded-md shadow-lg whitespace-nowrap">ה-BMI שלך: {bmi.toFixed(1)}</span>
          <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary-600 mx-auto mt-1"></div>
        </div>

        {/* BMI Scale Bar */}
        <div className="flex h-5 rounded-full overflow-hidden shadow-inner bg-slate-100">
          {categories.map((cat) => {
            const width = ((cat.end - lastEnd) / range) * 100;
            lastEnd = cat.end;
            return (
              <div key={cat.name} className={`${cat.color}`} style={{ width: `${width}%` }}></div>
            );
          })}
        </div>

        {/* Labels for scale */}
        <div className="relative h-4">
          <span style={{ transform: 'translateX(-50%)', left: `${getPositionPercentage(18.5)}%`}} className="absolute text-xs text-slate-500">18.5</span>
          <span style={{ transform: 'translateX(-50%)', left: `${getPositionPercentage(25)}%`}} className="absolute text-xs text-slate-500">25</span>
          <span style={{ transform: 'translateX(-50%)', left: `${getPositionPercentage(30)}%`}} className="absolute text-xs text-slate-500">30</span>
        </div>

        {/* Labels for categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-4 text-center text-sm">
            {categories.map(cat => (
                <div key={cat.name} className="flex items-center justify-center gap-2">
                   <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
                   <span className="text-slate-600 font-medium">{cat.name}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BmiChart;
