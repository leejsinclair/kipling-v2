export default function ScoreBreakdown({ result }) {
  if (!result) return null;
  
  const { totalScore, breakdown, wordCount } = result;
  
  const scoreColor = totalScore >= 50 ? 'text-green-600' : totalScore >= 35 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-2">Your Score</h3>
        <div className={`text-5xl font-bold ${scoreColor}`}>
          {totalScore}
        </div>
        <div className="text-sm text-gray-400 mt-1">out of 55 points</div>
      </div>
      
      <div className="space-y-3">
        <ScoreBar label="Completeness" score={breakdown.completeness} maxScore={10} />
        <ScoreBar label="Length" score={breakdown.length} maxScore={10} info={`${wordCount} words`} />
        <ScoreBar label="Clarity" score={breakdown.clarity} maxScore={10} />
        <ScoreBar label="Value Statement" score={breakdown.soThatQuality} maxScore={20} />
        <ScoreBar 
          label="Creativity" 
          score={breakdown.creativity} 
          maxScore={5} 
          tooltip="Word diversity - measures how varied your language is. Higher scores mean less repetition (85%+ unique words = 5pts, 75%+ = 3pts, 65%+ = 2pts)."
        />
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Score</span>
          <span className={`text-xl font-bold ${scoreColor}`}>{totalScore}</span>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, maxScore, info, tooltip }) {
  const percentage = (score / maxScore) * 100;
  const barColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          {tooltip && (
            <div className="group relative inline-block">
              <svg 
                className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <div className="invisible group-hover:visible absolute left-0 top-6 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-10 border border-slate-700">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {score}/{maxScore}
          {info && <span className="text-gray-400 ml-2">({info})</span>}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
