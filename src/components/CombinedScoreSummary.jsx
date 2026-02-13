export default function CombinedScoreSummary({ storyScore, criteriaScore }) {
  const combinedScore = storyScore + criteriaScore;
  const maxCombinedScore = 110; // 55 for story + 55 for criteria
  const percentage = Math.round((combinedScore / maxCombinedScore) * 100);

  const getOverallGrade = () => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', emoji: '🏆', message: 'Outstanding!' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', emoji: '🌟', message: 'Excellent work!' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', emoji: '👏', message: 'Great job!' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', emoji: '👍', message: 'Good effort!' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', emoji: '📈', message: 'Keep practicing!' };
    return { grade: 'F', color: 'text-red-600', emoji: '🔄', message: 'Try again!' };
  };

  const gradeInfo = getOverallGrade();

  return (
    <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 rounded-lg shadow-xl p-8 text-white">
      <div className="text-center">
        <div className="text-6xl mb-4">{gradeInfo.emoji}</div>
        <h3 className="text-3xl font-bold mb-2">
          Combined Quality Score
        </h3>
        <p className="text-blue-100 mb-6">{gradeInfo.message}</p>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="text-6xl font-bold mb-2">
            {combinedScore}
            <span className="text-3xl text-blue-200">/{maxCombinedScore}</span>
          </div>
          <div className={`text-4xl font-bold ${gradeInfo.color} bg-white rounded-lg py-2 px-4 inline-block`}>
            {gradeInfo.grade}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-200 mb-1">Story Score</div>
            <div className="text-3xl font-bold">{storyScore}</div>
            <div className="text-sm text-blue-200">out of 55</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="text-sm text-blue-200 mb-1">Criteria Score</div>
            <div className="text-3xl font-bold">{criteriaScore}</div>
            <div className="text-sm text-blue-200">out of 55</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-4">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-green-400 h-4 rounded-full transition-all duration-1000"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-sm text-blue-100 text-right mt-2">
          {percentage}% Quality
        </div>
      </div>
    </div>
  );
}
