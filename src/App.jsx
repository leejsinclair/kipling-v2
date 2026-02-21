import { useState, useEffect } from 'react';
import StoryForm from './components/StoryForm';
import ScoreBreakdown from './components/ScoreBreakdown';
import FeedbackPanel from './components/FeedbackPanel';
import ProgressBar from './components/ProgressBar';
import Achievements from './components/Achievements';
import StoryHistory from './components/StoryHistory';
import AcceptanceCriteriaForm from './components/AcceptanceCriteriaForm';
import CriteriaScoreBreakdown from './components/CriteriaScoreBreakdown';
import CriteriaFeedbackPanel from './components/CriteriaFeedbackPanel';
import StoryAndCriteriaExport from './components/StoryAndCriteriaExport';
import CombinedScoreSummary from './components/CombinedScoreSummary';
import ThemeSwitcher from './components/ThemeSwitcher';
import { scoreStory, checkAchievements } from './scoringEngine';
import { scoreCriteria, checkCriteriaAchievements } from './criteriaScoring';

function App() {
  const [phase, setPhase] = useState('story'); // 'story', 'criteria', or 'complete'
  const [currentStory, setCurrentStory] = useState(null);
  const [result, setResult] = useState(null);
  const [criteriaResult, setCriteriaResult] = useState(null);
  const [submittedCriteria, setSubmittedCriteria] = useState(null);
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
    setCurrentStory(story);
    
    // Add XP for story
    setTotalXP(prev => prev + scoreResult.totalScore);
    
    // Check achievements for story only
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
    
    // Move to criteria phase
    setPhase('criteria');
    
    // Scroll to criteria section
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleCriteriaSubmit = (criteriaData) => {
    const { criteria, format } = criteriaData;
    const scoreResult = scoreCriteria(criteria, currentStory?.soThat, format);
    setCriteriaResult(scoreResult);
    setSubmittedCriteria(criteria);
    
    // Add XP from criteria only (story XP was already added in handleSubmit)
    setTotalXP(prev => prev + scoreResult.totalScore);
    
    // Check criteria-specific achievements
    const criteriaAchievements = checkCriteriaAchievements(
      scoreResult.totalScore,
      criteria.length,
      scoreResult.breakdown
    );
    
    // Filter out already earned achievements
    const earnedIds = new Set(allAchievements.map(a => a.id));
    const freshCriteriaAchievements = criteriaAchievements.filter(a => !earnedIds.has(a.id));
    
    // Combine with any existing achievements from story
    setAchievements(prev => [...prev, ...freshCriteriaAchievements]);
    if (freshCriteriaAchievements.length > 0) {
      setAllAchievements(prev => [...prev, ...freshCriteriaAchievements]);
    }
    
    // Save to history with criteria
    const newStory = {
      ...currentStory,
      criteria: criteria,
      criteriaFormat: format,
      storyScore: result.totalScore,
      criteriaScore: scoreResult.totalScore,
      combinedScore: result.totalScore + scoreResult.totalScore,
      timestamp: Date.now()
    };
    setStoryHistory(prev => [...prev, newStory]);
    
    // Move to complete phase
    setPhase('complete');
    
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleStartNew = () => {
    setPhase('story');
    setCurrentStory(null);
    setResult(null);
    setCriteriaResult(null);
    setSubmittedCriteria(null);
    setAchievements([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'As a', 'I want', 'So that', 'Story Score', 'Criteria Score', 'Combined Score'].join(','),
      ...storyHistory.map(s => [
        new Date(s.timestamp).toISOString(),
        `"${s.asA}"`,
        `"${s.iWant}"`,
        `"${s.soThat}"`,
        s.storyScore || s.score || 0,
        s.criteriaScore || 0,
        s.combinedScore || s.score || 0
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📖 Agile Story Builder
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Learn to write better user stories through gamified practice
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <ProgressBar totalXP={totalXP} />
        </div>

        {/* Phase Indicator */}
        {phase !== 'story' && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                    ✓
                  </div>
                  <span className="text-sm font-medium text-gray-700">Story Written</span>
                </div>
                <div className="w-16 h-1 bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    phase === 'complete' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {phase === 'complete' ? '✓' : '2'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Acceptance Criteria</span>
                </div>
                {phase === 'complete' && (
                  <>
                    <div className="w-16 h-1 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                        ★
                      </div>
                      <span className="text-sm font-medium text-gray-700">Complete</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Phase 1: Story Form */}
        {phase === 'story' && (
          <div className="mb-8">
            <StoryForm onSubmit={handleSubmit} />
          </div>
        )}

        {/* Phase 1 Results */}
        {result && phase !== 'story' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Your Story Score</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreBreakdown result={result} />
              <FeedbackPanel result={result} />
            </div>
          </div>
        )}

        {/* Phase 2: Acceptance Criteria Form */}
        {phase === 'criteria' && currentStory && (
          <div className="mb-8">
            <AcceptanceCriteriaForm 
              onSubmit={handleCriteriaSubmit}
              storyText={`As a ${currentStory.asA}, I want ${currentStory.iWant} so that ${currentStory.soThat}.`}
            />
          </div>
        )}

        {/* Phase 2 Results */}
        {criteriaResult && phase === 'complete' && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Your Criteria Score</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CriteriaScoreBreakdown result={criteriaResult} />
              <CriteriaFeedbackPanel result={criteriaResult} />
            </div>
          </div>
        )}

        {/* Combined Score Summary */}
        {phase === 'complete' && result && criteriaResult && (
          <div className="mb-8">
            <CombinedScoreSummary 
              storyScore={result.totalScore}
              criteriaScore={criteriaResult.totalScore}
            />
          </div>
        )}

        {/* Export Section */}
        {phase === 'complete' && currentStory && submittedCriteria && (
          <div className="mb-8">
            <StoryAndCriteriaExport 
              story={currentStory}
              criteria={submittedCriteria}
            />
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <Achievements achievements={achievements} />
          </div>
        )}

        {/* Start New Button */}
        {phase === 'complete' && (
          <div className="mb-8">
            <button
              onClick={handleStartNew}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              ✨ Start New Story
            </button>
          </div>
        )}

        {/* Story History */}
        {storyHistory.length > 0 && (
          <div className="mb-8">
            <StoryHistory stories={storyHistory} onExport={handleExport} />
          </div>
        )}

        {/* Info Section */}
        {phase === 'story' && !result && (
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">✍️</div>
                <h3 className="font-semibold text-gray-800 mb-2">1. Write Story</h3>
                <p className="text-sm text-gray-600">
                  Fill in the three fields to create a complete user story in agile format
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">✅</div>
                <h3 className="font-semibold text-gray-800 mb-2">2. Add Criteria</h3>
                <p className="text-sm text-gray-600">
                  Write acceptance criteria that define when the story is complete
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-800 mb-2">3. Level Up</h3>
                <p className="text-sm text-gray-600">
                  Earn XP, unlock achievements, and progress from Novice to Product Sage
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 mt-16 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Built with React & Tailwind CSS • Helping teams write better user stories
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
