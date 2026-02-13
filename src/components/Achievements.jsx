export default function Achievements({ achievements }) {
  if (!achievements || achievements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Achievements</h3>
        <p className="text-sm text-gray-500 text-center py-8">
          Score stories to unlock achievements! 🏆
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Achievements Unlocked! 🎉</h3>
      <div className="space-y-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200 animate-pulse"
          >
            <div className="text-2xl">🏆</div>
            <div>
              <h4 className="font-semibold text-gray-800">{achievement.name}</h4>
              <p className="text-sm text-gray-600">{achievement.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
