
import React from 'react';

interface BmiChartProps {
  bmi: number;
}

const BmiChart: React.FC<BmiChartProps> = ({ bmi }) => {
  // Constants for the gauge
  const MIN_BMI = 15;
  const MAX_BMI = 40;
  const GAUGE_RADIUS = 90;
  const CENTER_X = 125;
  const CENTER_Y = 105;
  const ARC_WIDTH = 35;
  const LABEL_OFFSET = 18; // How far inside the arc to put the label

  const categories = [
    { name: 'תת משקל', max: 18.5, color: '#93c5fd' /* blue-300 */ },
    { name: 'תקין', max: 25, color: '#7dd3fc' /* sky-300 */ },
    { name: 'משקל עודף', max: 30, color: '#fcd34d' /* amber-300 */ },
    { name: 'השמנה', max: 35, color: '#f9a8d4' /* pink-300 */ },
    { name: 'השמנה קיצונית', max: MAX_BMI, color: '#f472b6' /* pink-400 */ }
  ];

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, startAngle);
    const end = polarToCartesian(x, y, radius, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const bmiToAngle = (bmiValue: number) => {
    const clampedBmi = Math.max(MIN_BMI, Math.min(MAX_BMI, bmiValue));
    return ((clampedBmi - MIN_BMI) / (MAX_BMI - MIN_BMI)) * 180;
  };
  
  const needleAngle = bmiToAngle(bmi);
  const currentCategory = categories.find(cat => bmi < cat.max) || categories[categories.length - 1];
  
  let lastMax = MIN_BMI;
  
  return (
    <div className="p-6 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl shadow-lg">
      <h3 className="text-4xl font-bold text-center text-pink-500 mb-2 tracking-wider">BMI</h3>
      
      <div className="relative w-full max-w-sm mx-auto" style={{paddingTop: '50%'}}> {/* Aspect ratio hack */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 250 125" className="w-full h-full">
            {categories.map((cat) => {
              const startAngle = bmiToAngle(lastMax);
              const endAngle = bmiToAngle(cat.max);
              const arcPath = describeArc(CENTER_X, CENTER_Y, GAUGE_RADIUS, startAngle, endAngle);
              const midAngle = startAngle + (endAngle - startAngle) / 2;
              const labelPos = polarToCartesian(CENTER_X, CENTER_Y, GAUGE_RADIUS - LABEL_OFFSET, midAngle);
              lastMax = cat.max;
              
              return (
                <g key={cat.name}>
                  <path d={arcPath} stroke={cat.color} strokeWidth={ARC_WIDTH} fill="none" />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="text-[10px] sm:text-xs font-bold fill-gray-800 pointer-events-none"
                  >
                    {cat.name}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Needle */}
          <div className="absolute w-full h-full top-0 left-0 flex justify-center" style={{ transform: `translateY(-${(125 - CENTER_Y) / 125 * 100}%)` }}>
            <div
              className="absolute bottom-0 w-1 origin-bottom transition-transform duration-700 ease-in-out"
              style={{
                height: `${(GAUGE_RADIUS - 10) / 125 * 100}%`,
                transform: `rotate(${needleAngle - 90}deg)`
              }}
            >
              <div className="w-full h-full bg-slate-800 rounded-t-full shadow-lg"></div>
            </div>
            {/* Pivot */}
            <div className="absolute bottom-0 w-6 h-6 bg-white rounded-full border-4 border-slate-800" style={{ transform: 'translateY(50%)' }}></div>
          </div>
        </div>
      </div>

      <div className="text-center mt-2">
        <p className="text-slate-600 text-lg">ה-BMI שלך הוא <span className="font-bold text-2xl text-slate-800">{bmi.toFixed(1)}</span></p>
        <p className="font-semibold text-xl text-slate-700">{currentCategory.name}</p>
      </div>
    </div>
  );
};

export default BmiChart;
