export default function CriteriaFeedbackPanel({ result }) {
  const { feedback, suggestions, hintTargets } = result;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        💡 Criteria Feedback
      </h3>

      {/* Feedback Messages */}
      <div className="space-y-3 mb-6">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Analysis:
        </div>
        {feedback && feedback.length > 0 ? (
          feedback.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded"
            >
              <div className="text-blue-600 text-lg flex-shrink-0">ℹ️</div>
              <div className="text-sm text-gray-700">{item}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 italic">No feedback available</div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Suggestions for Improvement:
          </div>
          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 bg-black/10 border-l-4 border-purple-400 p-3 rounded"
            >
              <div className="text-purple-600 text-lg flex-shrink-0">💡</div>
              <div className="text-sm text-gray-700">{suggestion}</div>
            </div>
          ))}
        </div>
      )}

      {/* Score-targeted hint targets */}
      {hintTargets && hintTargets.length > 0 && (
        <div className="space-y-3 mt-6">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Score-Targeted Hints:
          </div>
          {hintTargets.map((hint, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400 p-3 rounded"
            >
              <div className="text-amber-600 text-lg flex-shrink-0">🎯</div>
              <div className="text-sm text-gray-700">{hint}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-3">
          Quick Tips:
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Use observable outcomes: "system displays...", "user can..."</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Be specific about expected behaviours and results</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Align criteria with the story's value proposition</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-600">✓</span>
            <span>Cover happy path, edge cases, and error scenarios</span>
          </div>
        </div>
      </div>
    </div>
  );
}
