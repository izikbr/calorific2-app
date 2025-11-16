
import React from 'react';

interface BmiChartProps {
  bmi: number;
}

const BmiChart: React.FC<BmiChartProps> = ({ bmi }) => {
  const MIN_BMI = 15;
  const MAX_BMI = 40;
  const totalRange = MAX_BMI - MIN_BMI;

  const categories = [
    { name: 'תת משקל', max: 18.5, color: 'bg-sky-400', textColor: 'text-sky-600', range: 18.5 - MIN_BMI },
    { name: 'תקין', max: 25, color: 'bg-green-500', textColor: 'text-green-600', range: 25 - 18.5 },
    { name: 'עודף משקל', max: 30, color: 'bg-amber-400', textColor: 'text-amber-600', range: 30 - 25 },
    { name: 'השמנת יתר', max: MAX_BMI, color: 'bg-red-500', textColor: 'text-red-600', range: MAX_BMI - 30 }
  ];

  const getIndicatorPosition = (bmiValue: number) => {
    const clampedBmi = Math.max(MIN_BMI, Math.min(MAX_BMI, bmiValue));
    return ((clampedBmi - MIN_BMI) / totalRange) * 100;
  };
  
  const userBmiPositionPercent = getIndicatorPosition(bmi);
  const currentCategory = categories.find(cat => bmi < cat.max) || categories[categories.length - 1];

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">מדד מסת גוף (BMI)</h3>
      
      <div className="relative pt-8 pb-10 px-2">
        {/* User's BMI indicator */}
        <div 
          className="absolute z-10" 
          style={{ left: `${userBmiPositionPercent}%`, bottom: '2.75rem', transform: 'translateX(-50%)' }}
          aria-label={`Your BMI is ${bmi.toFixed(1)}`}
        >
           <div className="flex flex-col items-center">
              <span className="px-2 py-1 bg-slate-700 text-white text-xs font-bold rounded-md mb-1 whitespace-nowrap shadow-lg">
                  {bmi.toFixed(1)}
              </span>
              <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-700"></div>
          </div>
        </div>

        {/* The colored bar */}
        <div className="flex h-4 rounded-full overflow-hidden shadow-inner bg-slate-200">
          {categories.map(cat => (
            <div 
              key={cat.name} 
              className={cat.color} 
              style={{ width: `${(cat.range / totalRange) * 100}%` }}
              title={`${cat.name}`}
            />
          ))}
        </div>
        
        {/* The labels below the bar */}
        <div className="relative h-4 mt-1">
          {categories.slice(0, -1).map((cat) => {
              const positionPercent = ((cat.max - MIN_BMI) / totalRange) * 100;
              return (
                  <div key={cat.max} className="absolute top-0" style={{ left: `${positionPercent}%`, transform: 'translateX(-50%)' }}>
                      <div className="h-2 w-px bg-slate-400 mx-auto"></div>
                      <span className="text-xs text-slate-500 font-medium">{cat.max}</span>
                  </div>
              )
          })}
        </div>
      </div>
      
      <div className="text-center">
          <p className="text-slate-600">
            ה-BMI שלך הוא 
            <span className="font-bold text-lg text-slate-800 mx-1">{bmi.toFixed(1)}</span>
            (<span className={`font-semibold ${currentCategory.textColor}`}>{currentCategory.name}</span>)
          </p>
      </div>
    </div>
  );
};

export default BmiChart;
