import { calculateProgression } from '../scoringEngine';

export default function ProgressBar({ totalXP, allAchievements = [], allBadges = [] }) {
  const { currentLevel, nextLevel } = calculateProgression(totalXP);
  const collectedIds = new Set(allAchievements.map((achievement) => achievement.id));
  
  const progressToNext = nextLevel 
    ? ((totalXP - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{currentLevel.name}</h3>
          <p className="text-sm text-gray-600">Total XP: {totalXP}</p>
          {allBadges.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-medium text-gray-500">Badges:</span>
              {allBadges.map((badge) => {
                const isCollected = collectedIds.has(badge.id);
                const tooltipText = isCollected
                  ? badge.description
                  : `🔒 ${badge.requirement || badge.description}`;

                return (
                  <span
                    key={badge.id}
                    title={tooltipText}
                    className={`text-xs px-2 py-1 rounded-full border ${
                      isCollected
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-transparent text-gray-400 border-gray-300'
                    }`}
                  >
                    {isCollected ? '🏆' : '◌'} {badge.name}
                  </span>
                );
              })}
            </div>
          )}
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
