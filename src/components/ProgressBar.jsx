import { calculateProgression } from '../scoringEngine';

export default function ProgressBar({ totalXP }) {
  const { currentLevel, nextLevel } = calculateProgression(totalXP);
  
  const progressToNext = nextLevel 
    ? ((totalXP - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{currentLevel.name}</h3>
          <p className="text-sm text-gray-600">Total XP: {totalXP}</p>
        </div>
        {nextLevel && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Next Level</p>
            <p className="text-sm font-semibold text-blue-600">{nextLevel.name}</p>
          </div>
        )}
      </div>
      
      {nextLevel ? (
        <>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{currentLevel.threshold} XP</span>
            <span>{nextLevel.threshold} XP</span>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm font-semibold text-purple-600">🎉 Maximum Level Achieved! 🎉</p>
        </div>
      )}
    </div>
  );
}
