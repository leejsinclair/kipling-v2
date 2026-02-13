export default function FeedbackPanel({ result }) {
  if (!result) return null;
  
  const { feedback, suggestions } = result;
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Feedback & Tips</h3>
      
      {feedback && feedback.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Analysis:</h4>
          <ul className="space-y-1">
            {feedback.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span className="text-sm text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {suggestions && suggestions.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700">Suggestions:</h4>
          <ul className="space-y-1">
            {suggestions.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">💡</span>
                <span className="text-sm text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {(!feedback || feedback.length === 0) && (!suggestions || suggestions.length === 0) && (
        <p className="text-sm text-gray-500 italic">Submit a story to see feedback!</p>
      )}
    </div>
  );
}
