import { useState } from 'react';
import { calculateProgression, STORY_BADGES } from '../scoringEngine';
import { CRITERIA_BADGES } from '../criteriaScoring';

const ALL_BADGES = [...STORY_BADGES, ...CRITERIA_BADGES];

function Badge({ badge, earned }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label={`${badge.name}${earned ? ' (earned)' : ' (locked)'}`}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        onFocus={() => setTooltipVisible(true)}
        onBlur={() => setTooltipVisible(false)}
        className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-lg transition-all ${
          earned
            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-500 shadow-sm'
            : 'border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-800 opacity-40 grayscale'
        }`}
      >
        {badge.emoji}
      </button>
      {tooltipVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-44 rounded-md bg-gray-800 dark:bg-slate-700 px-2 py-1.5 text-xs text-white shadow-lg pointer-events-none">
          <p className="font-semibold">{badge.name}</p>
          <p className="mt-0.5 text-gray-300">{earned ? '✅ Earned!' : badge.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  );
}

export default function ProgressBar({ totalXP, allAchievements = [] }) {
  const { currentLevel, nextLevel } = calculateProgression(totalXP);
  const earnedIds = new Set(allAchievements.map((a) => a.id));

  const progressToNext = nextLevel 
    ? ((totalXP - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100
    : 100;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{currentLevel.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total XP: {totalXP}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {ALL_BADGES.map((badge) => (
            <Badge key={badge.id} badge={badge} earned={earnedIds.has(badge.id)} />
          ))}
        </div>
      </div>
      
      {nextLevel ? (
        <>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{currentLevel.threshold} XP</span>
            {nextLevel && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">Next: {nextLevel.name}</span>
            )}
            <span>{nextLevel.threshold} XP</span>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">🎉 Maximum Level Achieved! 🎉</p>
        </div>
      )}
    </div>
  );
}
