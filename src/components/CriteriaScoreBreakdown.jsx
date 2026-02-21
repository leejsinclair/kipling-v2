const CATEGORY_TOOLTIPS = {
  Format: {
    explanation: 'Points awarded for following Gherkin format or clear bullet-point structure.',
    examples: [
      'Good: "Given I am logged in\nWhen I click export\nThen I see a file"',
      'Good: "The user can export data to CSV format"',
      'Avoid: Mixing formats or using vague sentence structure'
    ]
  },
  Testability: {
    explanation: 'Measures whether the criterion describes observable, verifiable outcomes that a tester can confirm.',
    examples: [
      'Good: "Then I see a success message on screen"',
      'Good: "The system must return a 200 status code"',
      'Avoid: "The system should be better" (not measurable)'
    ]
  },
  Specificity: {
    explanation: 'Evaluates clarity and precision of language, avoiding vague or ambiguous terms.',
    examples: [
      'Good: "The user receives an email within 5 minutes"',
      'Good: "The dashboard displays the last 30 days of data"',
      'Avoid: "It works quickly" or "The page looks good"'
    ]
  },
  Alignment: {
    explanation: 'Checks whether the criteria support the story\'s intended value and business outcome.',
    examples: [
      'Good: If story is about "save time," criteria mention automation or speed',
      'Good: Criteria test the "so that" value directly',
      'Avoid: Criteria unrelated to the story\'s purpose'
    ]
  },
  Completeness: {
    explanation: 'Assesses whether the criteria cover happy paths, error cases, and edge scenarios adequately.',
    examples: [
      'Good: Covers success, validation errors, and edge cases',
      'Good: Tests both typical and boundary conditions',
      'Avoid: Only testing one scenario or missing error handling'
    ]
  }
};

export default function CriteriaScoreBreakdown({ result }) {
  const { totalScore, breakdown } = result;
  
  const maxScore = 55;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  const categories = [
    { 
      name: 'Format', 
      score: breakdown.format || 0, 
      max: 10,
      description: 'Gherkin or structured format'
    },
    { 
      name: 'Testability', 
      score: breakdown.testability || 0, 
      max: 15,
      description: 'Observable, verifiable outcomes'
    },
    { 
      name: 'Specificity', 
      score: breakdown.specificity || 0, 
      max: 10,
      description: 'Clear, unambiguous language'
    },
    { 
      name: 'Alignment', 
      score: breakdown.alignment || 0, 
      max: 10,
      description: 'Matches story value'
    },
    { 
      name: 'Completeness', 
      score: breakdown.completeness || 0, 
      max: 10,
      description: 'Coverage of scenario'
    }
  ];

  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getGrade = () => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600', emoji: '🌟' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600', emoji: '✨' };
    if (percentage >= 70) return { grade: 'B', color: 'text-blue-600', emoji: '👍' };
    if (percentage >= 60) return { grade: 'C', color: 'text-yellow-600', emoji: '👌' };
    if (percentage >= 50) return { grade: 'D', color: 'text-orange-600', emoji: '📝' };
    return { grade: 'F', color: 'text-red-600', emoji: '🔄' };
  };

  const gradeInfo = getGrade();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        📊 Criteria Score Breakdown
      </h3>
      
      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total Score</div>
            <div className="text-4xl font-bold text-gray-900">
              {totalScore}
              <span className="text-2xl text-gray-500">/{maxScore}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-1">{gradeInfo.emoji}</div>
            <div className={`text-2xl font-bold ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 text-right mt-1">
            {percentage}%
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        {categories.map((category) => {
          const tooltipContent = CATEGORY_TOOLTIPS[category.name];
          return (
            <div key={category.name} className="border-b border-gray-100 pb-3 last:border-0">
              <div className="flex justify-between items-start mb-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800 dark:text-white">{category.name}</div>
                    <div className="group relative">
                      <span className="inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 cursor-help hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        ℹ
                      </span>
                      <div className="absolute left-0 top-6 hidden group-hover:block z-10 w-80 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900 dark:text-white mb-2">{tooltipContent.explanation}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                            <div className="font-semibold text-gray-700 dark:text-gray-200 mt-2 mb-1">Examples:</div>
                            {tooltipContent.examples.map((example, idx) => (
                              <div key={idx} className="pl-2 border-l-2 border-gray-300 dark:border-gray-600">
                                {example}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{category.description}</div>
                </div>
                <div className={`text-lg font-bold ${getScoreColor(category.score, category.max)}`}>
                  {category.score}/{category.max}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    (category.score / category.max) >= 0.8 ? 'bg-green-500' :
                    (category.score / category.max) >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${(category.score / category.max) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Criteria Count */}
      {result.criteriaCount && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Number of criteria: <span className="font-semibold">{result.criteriaCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}
