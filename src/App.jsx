import { useState, useEffect } from 'react';
import StoryForm from './components/StoryForm';
import ScoreBreakdown from './components/ScoreBreakdown';
import FeedbackPanel from './components/FeedbackPanel';
import ProgressBar from './components/ProgressBar';
import Achievements from './components/Achievements';
import StoryHistory from './components/StoryHistory';
import { scoreStory, checkAchievements } from './scoringEngine';

function App() {
  const [result, setResult] = useState(null);
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem('totalXP');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [storyHistory, setStoryHistory] = useState(() => {
    const saved = localStorage.getItem('storyHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [achievements, setAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState(() => {
    const saved = localStorage.getItem('allAchievements');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('totalXP', totalXP.toString());
  }, [totalXP]);

  useEffect(() => {
    localStorage.setItem('storyHistory', JSON.stringify(storyHistory));
  }, [storyHistory]);

  useEffect(() => {
    localStorage.setItem('allAchievements', JSON.stringify(allAchievements));
  }, [allAchievements]);

  const handleSubmit = (story) => {
    const scoreResult = scoreStory(story);
    setResult(scoreResult);
    
    // Add XP
    setTotalXP(prev => prev + scoreResult.totalScore);
    
    // Check achievements
    const newAchievements = checkAchievements(
      scoreResult.totalScore, 
      scoreResult.wordCount,
      storyHistory
    );
    
    // Filter out already earned achievements
    const earnedIds = new Set(allAchievements.map(a => a.id));
    const freshAchievements = newAchievements.filter(a => !earnedIds.has(a.id));
    
    setAchievements(freshAchievements);
    if (freshAchievements.length > 0) {
      setAllAchievements(prev => [...prev, ...freshAchievements]);
    }
    
    // Save to history
    const newStory = {
      ...story,
      score: scoreResult.totalScore,
      timestamp: Date.now()
    };
    setStoryHistory(prev => [...prev, newStory]);
    
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'As a', 'I want', 'So that', 'Score'].join(','),
      ...storyHistory.map(s => [
        new Date(s.timestamp).toISOString(),
        `"${s.asA}"`,
        `"${s.iWant}"`,
        `"${s.soThat}"`,
        s.score
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-stories-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            📖 Agile Story Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Learn to write better user stories through gamified practice
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar totalXP={totalXP} />
        </div>

        {/* Story Form */}
        <div className="mb-8">
          <StoryForm onSubmit={handleSubmit} />
        </div>

        {/* Results Grid */}
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ScoreBreakdown result={result} />
            <FeedbackPanel result={result} />
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <Achievements achievements={achievements} />
          </div>
        )}

        {/* Story History */}
        {storyHistory.length > 0 && (
          <div className="mb-8">
            <StoryHistory stories={storyHistory} onExport={handleExport} />
          </div>
        )}

        {/* Info Section */}
        {!result && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">✍️</div>
                <h3 className="font-semibold text-gray-800 mb-2">Write Stories</h3>
                <p className="text-sm text-gray-600">
                  Fill in the three fields to create a complete user story in agile format
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800 mb-2">Get Scored</h3>
                <p className="text-sm text-gray-600">
                  Receive instant feedback on completeness, clarity, and value statement quality
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-800 mb-2">Level Up</h3>
                <p className="text-sm text-gray-600">
                  Earn XP, unlock achievements, and progress from Novice to Product Sage
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            Built with React & Tailwind CSS • Helping teams write better user stories
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
