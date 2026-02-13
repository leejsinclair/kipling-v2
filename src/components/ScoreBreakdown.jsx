export default function ScoreBreakdown({ result }) {
  if (!result) return null;
  
  const { totalScore, breakdown, wordCount } = result;
  
  const scoreColor = totalScore >= 50 ? 'text-green-600' : totalScore >= 35 ? 'text-yellow-600' : 'text-red-600';
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Score</h3>
        <div className={`text-5xl font-bold ${scoreColor}`}>
          {totalScore}
        </div>
        <div className="text-sm text-gray-500 mt-1">out of 55 points</div>
      </div>
      
      <div className="space-y-3">
        <ScoreBar label="Completeness" score={breakdown.completeness} maxScore={10} />
        <ScoreBar label="Length" score={breakdown.length} maxScore={10} info={`${wordCount} words`} />
        <ScoreBar label="Clarity" score={breakdown.clarity} maxScore={10} />
        <ScoreBar label="Value Statement" score={breakdown.soThatQuality} maxScore={20} />
        <ScoreBar label="Creativity" score={breakdown.creativity} maxScore={5} />
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

function ScoreBar({ label, score, maxScore, info }) {
  const percentage = (score / maxScore) * 100;
  const barColor = percentage >= 80 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
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
