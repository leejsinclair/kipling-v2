export default function StoryHistory({ stories, onExport }) {
  if (!stories || stories.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Story History</h3>
        <button
          onClick={onExport}
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          Export All
        </button>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {stories.slice().reverse().map((story) => (
          <div
            key={story.timestamp}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(story.timestamp).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">As a</span>{' '}
                  <span className="text-gray-600">{story.asA}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">I want</span>{' '}
                  <span className="text-gray-600">{story.iWant}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">So that</span>{' '}
                  <span className="text-gray-600">{story.soThat}</span>
                </p>
              </div>
              <div className="ml-4">
                <div className={`text-2xl font-bold ${
                  (story.combinedScore || story.score || 0) >= 50 ? 'text-green-600' : 
                  (story.combinedScore || story.score || 0) >= 35 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {story.combinedScore || story.score || 0}
                </div>
                <div className="text-xs text-gray-500 text-center">pts</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
