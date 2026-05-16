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
import AIAccessPanel from './components/AIAccessPanel';
import { scoreStory, checkAchievements } from './scoringEngine';
import { scoreCriteria, checkCriteriaAchievements } from './criteriaScoring';
import { validateOpenAIKey, improveStoryWithAI, improveCriteriaWithAI } from './llmService';

/**
 * Scrolls to the bottom after state updates so newly revealed results stay in view.
 */
function scrollToPageBottom() {
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, 100);
}

/**
 * Builds the canonical story sentence shown to the criteria step.
 * @param {object} story
 * @returns {string}
 */
function buildStoryText(story) {
  return `As a ${story.asA}, I want ${story.iWant} so that ${story.soThat}.`;
}

/**
 * Extracts story form fields with safe string fallbacks.
 * @param {object} story
 * @returns {{asA: string, iWant: string, soThat: string}}
 */
function getStoryFields(story) {
  return {
    asA: story?.asA || '',
    iWant: story?.iWant || '',
    soThat: story?.soThat || '',
  };
}

/**
 * Clones AI criteria suggestions and marks each one as not yet applied.
 * @param {object} suggestion
 * @returns {object}
 */
function markCriteriaSuggestionsPending(suggestion) {
  return {
    ...suggestion,
    suggestions: (suggestion?.suggestions || []).map((item) => ({ ...item, applied: false })),
  };
}

/**
 * Finds the best criteria index to replace for a single AI suggestion.
 * @param {string[]} criteria
 * @param {{original?: string}} suggestion
 * @param {number} suggestionIndex
 * @returns {number}
 */
function findCriteriaSuggestionTargetIndex(criteria, suggestion, suggestionIndex) {
  const originalNormalized = (suggestion.original || '').trim();
  const matchedIndex = criteria.findIndex((criterion) => (criterion || '').trim() === originalNormalized);
  if (matchedIndex >= 0) {
    return matchedIndex;
  }

  return suggestionIndex < criteria.length ? suggestionIndex : -1;
}

/**
 * Builds the next criteria draft state after applying one AI suggestion.
 * @param {{criteria: string[], format?: string}} criteriaDraftInput
 * @param {{improved: string, original?: string}} suggestion
 * @param {number} suggestionIndex
 * @returns {{criteria: string[], format: string} | null}
 */
function buildAppliedCriteriaData(criteriaDraftInput, suggestion, suggestionIndex) {
  const currentCriteria = [...criteriaDraftInput.criteria];
  const targetIndex = findCriteriaSuggestionTargetIndex(currentCriteria, suggestion, suggestionIndex);
  if (targetIndex < 0) {
    return null;
  }

  currentCriteria[targetIndex] = suggestion.improved;
  const format = criteriaDraftInput?.format ?? 'gherkin';
  return {
    criteria: currentCriteria,
    format,
  };
}

/**
 * Determines whether history loading should restore story state from a saved entry.
 * @param {{confirmedStory: object|null, storyFinalResult: object|null, storyDraftInput: object|null, storyDraftResult: object|null}} state
 * @returns {boolean}
 */
function shouldHydrateStoryFromHistory({ confirmedStory, storyFinalResult, storyDraftInput, storyDraftResult }) {
  return !(confirmedStory || storyFinalResult || storyDraftInput || storyDraftResult);
}

/**
 * Builds the request payload for criteria improvement calls.
 * @param {object} criteriaDraftInput
 * @param {object} criteriaDraftResult
 * @param {object} confirmedStory
 * @param {string} aiApiKey
 * @returns {object}
 */
function buildImproveCriteriaRequest(criteriaDraftInput, criteriaDraftResult, confirmedStory, aiApiKey) {
  return {
    criteria: criteriaDraftInput?.criteria,
    format: criteriaDraftInput?.format,
    draftScore: criteriaDraftResult?.totalScore,
    breakdown: criteriaDraftResult?.breakdown,
    hintTargets: criteriaDraftResult?.hintTargets,
    story: confirmedStory,
    apiKey: aiApiKey,
  };
}

function AIDisabledButton({ label }) {
  return (
    <button
      disabled
      title="Enable AI in the panel above to use this feature"
      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-md cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function StoryDraftActions({ aiEnabled, storyAISuggestion, handleImproveStoryWithAI, storyAILoading, handleConfirmStory }) {
  return (
    <div className="flex flex-wrap gap-3">
      {aiEnabled && !storyAISuggestion ? (
        <button
          onClick={handleImproveStoryWithAI}
          disabled={storyAILoading}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {storyAILoading ? '⏳ Improving…' : '✨ Improve with AI'}
        </button>
      ) : (
        !aiEnabled && <AIDisabledButton label="✨ Improve with AI" />
      )}
      <button
        onClick={handleConfirmStory}
        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
      >
        ✅ Confirm Story
      </button>
    </div>
  );
}

function StoryConfirmedPanel({ confirmedStory, handleScoreFinalStory }) {
  return (
    <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
        ✅ Story Confirmed
      </h3>
      <p className="text-sm text-green-700 dark:text-green-300 mb-1">
        <span className="font-medium">As a:</span> {confirmedStory.asA}
      </p>
      <p className="text-sm text-green-700 dark:text-green-300 mb-1">
        <span className="font-medium">I want:</span> {confirmedStory.iWant}
      </p>
      <p className="text-sm text-green-700 dark:text-green-300 mb-4">
        <span className="font-medium">So that:</span> {confirmedStory.soThat}
      </p>
      <button
        onClick={handleScoreFinalStory}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        🎯 Calculate Final Story Score
      </button>
    </div>
  );
}

function CriteriaDraftActions({
  aiEnabled,
  criteriaAISuggestion,
  handleImproveCriteriaWithAI,
  criteriaAILoading,
  handleConfirmCriteria,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {aiEnabled && !criteriaAISuggestion ? (
        <button
          onClick={handleImproveCriteriaWithAI}
          disabled={criteriaAILoading}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {criteriaAILoading ? '⏳ Improving…' : '✨ Improve Criteria with AI'}
        </button>
      ) : (
        !aiEnabled && <AIDisabledButton label="✨ Improve Criteria with AI" />
      )}
      <button
        onClick={handleConfirmCriteria}
        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
      >
        ✅ Confirm Criteria
      </button>
    </div>
  );
}

function CriteriaConfirmedPanel({ confirmedCriteria, handleScoreFinalCriteria }) {
  return (
    <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
        ✅ Criteria Confirmed ({confirmedCriteria.criteria.length} criteria)
      </h3>
      <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-300 mb-4 space-y-1">
        {confirmedCriteria.criteria.map((criterion, index) => (
          <li key={index} className="truncate">{criterion}</li>
        ))}
      </ul>
      <button
        onClick={handleScoreFinalCriteria}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        🎯 Calculate Final Criteria Score
      </button>
    </div>
  );
}

function CriteriaCompleteResults({ criteriaFinalResult, criteriaDraftResult }) {
  if (!criteriaFinalResult) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
        ✅ Your Criteria Score
      </h2>
      <ScoreDelta draftScore={criteriaDraftResult?.totalScore} finalScore={criteriaFinalResult.totalScore} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CriteriaScoreBreakdown result={criteriaFinalResult} />
        <CriteriaFeedbackPanel result={criteriaFinalResult} />
      </div>
    </div>
  );
}

function CompletionSummary({ storyFinalResult, criteriaFinalResult }) {
  if (!storyFinalResult || !criteriaFinalResult) return null;

  return (
    <div className="mb-8">
      <CombinedScoreSummary
        storyScore={storyFinalResult.totalScore}
        criteriaScore={criteriaFinalResult.totalScore}
      />
    </div>
  );
}

function CompletionExport({ confirmedStory, confirmedCriteria }) {
  if (!confirmedStory || !confirmedCriteria) return null;

  return (
    <div className="mb-8">
      <StoryAndCriteriaExport
        story={confirmedStory}
        criteria={confirmedCriteria.criteria}
      />
    </div>
  );
}

function StartNewStoryButton({ handleStartNew }) {
  return (
    <div className="mb-8">
      <button
        onClick={handleStartNew}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
      >
        ✨ Start New Story
      </button>
    </div>
  );
}

function ScoreDelta({ draftScore, finalScore }) {
  if (draftScore == null) return null;
  const delta = finalScore - draftScore;

  return (
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Draft: {draftScore} → Final: {finalScore}
      {delta !== 0 && (
        <span className={delta > 0 ? ' text-green-500 ml-1' : ' text-red-500 ml-1'}>
          ({delta > 0 ? '+' : ''}{delta})
        </span>
      )}
    </p>
  );
}

function StoryAISuggestionPanel({ storyAISuggestion, onApply, onDismiss }) {
  if (!storyAISuggestion) return null;
  const { issues, suggestion, rationale } = storyAISuggestion;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🤖 AI Suggestion</h4>
      {issues?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Issues found:</p>
          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
            {issues.map((issue, index) => <li key={index}>{issue}</li>)}
          </ul>
        </div>
      )}
      {suggestion && (
        <div className="mb-3 bg-white dark:bg-slate-800 rounded p-3 text-sm space-y-1">
          <p><span className="font-medium">As a:</span> {suggestion.asA}</p>
          <p><span className="font-medium">I want:</span> {suggestion.iWant}</p>
          <p><span className="font-medium">So that:</span> {suggestion.soThat}</p>
        </div>
      )}
      {rationale?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Why this helps:</p>
          <ul className="list-disc list-inside text-xs text-blue-600 dark:text-blue-400 space-y-1">
            {rationale.map((item, index) => <li key={index}><strong>{item.criterion}:</strong> {item.reason}</li>)}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        {suggestion && (
          <button
            onClick={onApply}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Suggestion
          </button>
        )}
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function CriteriaAISuggestionPanel({ criteriaAISuggestion, onApplyAll, onApplyOne, onDismiss }) {
  if (!criteriaAISuggestion) return null;
  const { suggestions, guidance } = criteriaAISuggestion;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">🤖 AI Suggestion</h4>
      {suggestions?.length > 0 && (
        <div className="mb-3 space-y-2">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded p-3 text-sm">
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Original:</p>
              <p className="mb-2 text-gray-700 dark:text-gray-300">{suggestion.original}</p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mb-1">Improved:</p>
              <p className="text-blue-800 dark:text-blue-200">{suggestion.improved}</p>
              <div className="mt-3">
                <button
                  onClick={() => onApplyOne(index)}
                  disabled={Boolean(suggestion.applied)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    suggestion.applied
                      ? 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {suggestion.applied ? 'Applied' : 'Apply Suggestion'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {guidance?.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Guidance:</p>
          <ul className="list-disc list-inside text-xs text-blue-600 dark:text-blue-400 space-y-1">
            {guidance.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}
      <div className="flex gap-2">
        {suggestions?.length > 0 && (
          <button
            onClick={onApplyAll}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply All Suggestions
          </button>
        )}
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function AppHeader({ storyHistoryLength }) {
  return (
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
          <div className="flex items-center gap-4">
            {storyHistoryLength > 0 && (
              <button
                onClick={() => document.getElementById('session-history')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                📜 Session History ({storyHistoryLength})
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function StoryPhaseSection(props) {
  const {
    phase,
    confirmedStory,
    storyFormVersion,
    handleScoreDraftStory,
    initialStoryData,
    storyDraftResult,
    storyAISuggestion,
    handleApplyStorySuggestion,
    setStoryAISuggestion,
    storyAIError,
    aiEnabled,
    handleImproveStoryWithAI,
    storyAILoading,
    handleConfirmStory,
    handleScoreFinalStory,
  } = props;

  if (phase !== 'story') return null;

  return (
    <div className="mb-8">
      {!confirmedStory && (
        <StoryForm
          key={storyFormVersion}
          onSubmit={handleScoreDraftStory}
          initialStory={initialStoryData}
        />
      )}

      {storyDraftResult && !confirmedStory && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            📝 Draft Story Score
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <ScoreBreakdown result={storyDraftResult} />
            <FeedbackPanel result={storyDraftResult} />
          </div>

          <StoryAISuggestionPanel
            storyAISuggestion={storyAISuggestion}
            onApply={handleApplyStorySuggestion}
            onDismiss={() => setStoryAISuggestion(null)}
          />

          {storyAIError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
              ⚠ {storyAIError}
            </p>
          )}

          <StoryDraftActions
            aiEnabled={aiEnabled}
            storyAISuggestion={storyAISuggestion}
            handleImproveStoryWithAI={handleImproveStoryWithAI}
            storyAILoading={storyAILoading}
            handleConfirmStory={handleConfirmStory}
          />
        </div>
      )}

      {confirmedStory && !props.storyFinalResult && (
        <StoryConfirmedPanel
          confirmedStory={confirmedStory}
          handleScoreFinalStory={handleScoreFinalStory}
        />
      )}
    </div>
  );
}

function StoryFinalSection({ storyFinalResult, phase, storyDraftResult }) {
  if (!storyFinalResult || phase === 'story') return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-200 mb-1">📝 Your Story Score</h2>
      <ScoreDelta draftScore={storyDraftResult?.totalScore} finalScore={storyFinalResult.totalScore} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreBreakdown result={storyFinalResult} />
        <FeedbackPanel result={storyFinalResult} />
      </div>
    </div>
  );
}

function CriteriaPhaseSection(props) {
  const {
    phase,
    confirmedStory,
    confirmedCriteria,
    criteriaFormVersion,
    handleScoreDraftCriteria,
    initialCriteriaData,
    criteriaDraftResult,
    criteriaAISuggestion,
    handleApplyCriteriaSuggestion,
    handleApplySingleCriteriaSuggestion,
    setCriteriaAISuggestion,
    criteriaAIError,
    aiEnabled,
    handleImproveCriteriaWithAI,
    criteriaAILoading,
    handleConfirmCriteria,
    handleScoreFinalCriteria,
    criteriaFinalResult,
  } = props;

  if (phase !== 'criteria' || !confirmedStory) return null;

  return (
    <div className="mb-8">
      {!confirmedCriteria && (
        <AcceptanceCriteriaForm
          key={criteriaFormVersion}
          onSubmit={handleScoreDraftCriteria}
          storyText={buildStoryText(confirmedStory)}
          initialCriteriaData={initialCriteriaData}
        />
      )}

      {criteriaDraftResult && !confirmedCriteria && (
        <div className="mt-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            ✅ Draft Criteria Score
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <CriteriaScoreBreakdown result={criteriaDraftResult} />
            <CriteriaFeedbackPanel result={criteriaDraftResult} />
          </div>

          <CriteriaAISuggestionPanel
            criteriaAISuggestion={criteriaAISuggestion}
            onApplyAll={handleApplyCriteriaSuggestion}
            onApplyOne={handleApplySingleCriteriaSuggestion}
            onDismiss={() => setCriteriaAISuggestion(null)}
          />

          {criteriaAIError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
              ⚠ {criteriaAIError}
            </p>
          )}

          <CriteriaDraftActions
            aiEnabled={aiEnabled}
            criteriaAISuggestion={criteriaAISuggestion}
            handleImproveCriteriaWithAI={handleImproveCriteriaWithAI}
            criteriaAILoading={criteriaAILoading}
            handleConfirmCriteria={handleConfirmCriteria}
          />
        </div>
      )}

      {confirmedCriteria && !criteriaFinalResult && (
        <CriteriaConfirmedPanel
          confirmedCriteria={confirmedCriteria}
          handleScoreFinalCriteria={handleScoreFinalCriteria}
        />
      )}
    </div>
  );
}

function CompletePhaseSection({
  phase,
  criteriaFinalResult,
  criteriaDraftResult,
  storyFinalResult,
  confirmedStory,
  confirmedCriteria,
  achievements,
  handleStartNew,
}) {
  const isComplete = phase === 'complete';
  if (!isComplete) {
    return achievements.length > 0 ? (
      <div className="mb-8">
        <Achievements achievements={achievements} />
      </div>
    ) : null;
  }

  return (
    <>
      <CriteriaCompleteResults
        criteriaFinalResult={criteriaFinalResult}
        criteriaDraftResult={criteriaDraftResult}
      />
      <CompletionSummary
        storyFinalResult={storyFinalResult}
        criteriaFinalResult={criteriaFinalResult}
      />
      <CompletionExport
        confirmedStory={confirmedStory}
        confirmedCriteria={confirmedCriteria}
      />

      {achievements.length > 0 && (
        <div className="mb-8">
          <Achievements achievements={achievements} />
        </div>
      )}

      <StartNewStoryButton handleStartNew={handleStartNew} />
    </>
  );
}

function HistorySection({
  storyHistory,
  handleRemoveHistoryItem,
  handleClearHistory,
  handleLoadStoryFromHistory,
  handleLoadCriteriaFromHistory,
}) {
  if (storyHistory.length === 0) return null;

  return (
    <div id="session-history" className="mb-8">
      <StoryHistory
        stories={storyHistory}
        onRemoveStory={handleRemoveHistoryItem}
        onClearHistory={handleClearHistory}
        onLoadStory={handleLoadStoryFromHistory}
        onLoadCriteria={handleLoadCriteriaFromHistory}
      />
    </div>
  );
}

function IntroSection({ phase, storyDraftResult }) {
  if (phase !== 'story' || storyDraftResult) return null;

  return (
    <div className="dark:bg-slate-800 rounded-lg shadow-lg p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">How It Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-3xl mb-2">✍️</div>
          <h3 className="font-semibold text-gray-200 mb-2">1. Write Story</h3>
          <p className="text-sm text-gray-600">
            Fill in the three fields to create a complete user story in agile format
          </p>
        </div>
        <div>
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-gray-200 mb-2">2. Add Criteria</h3>
          <p className="text-sm text-gray-600">
            Write acceptance criteria that define when the story is complete
          </p>
        </div>
        <div>
          <div className="text-3xl mb-2">🎯</div>
          <h3 className="font-semibold text-gray-200 mb-2">3. Level Up</h3>
          <p className="text-sm text-gray-600">
            Earn XP, unlock achievements, and progress from Novice to Product Sage
          </p>
        </div>
      </div>
    </div>
  );
}

function AppFooter() {
  return (
    <footer className="bg-white dark:bg-slate-800 mt-16 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-center text-sm text-gray-600 dark:text-gray-300">
          Built with React & Tailwind CSS • Helping teams write better user stories
        </p>
      </div>
    </footer>
  );
}

function App() {
  // Phase: 'story' | 'criteria' | 'complete'
  const [phase, setPhase] = useState('story');

  // ── AI session state (in-memory only, never persisted) ──────────────────
  const [aiApiKey, setAiApiKey] = useState(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiStatus, setAiStatus] = useState('idle'); // 'idle'|'validating'|'enabled'|'error'
  const [aiError, setAiError] = useState(null);

  // ── Story flow state ─────────────────────────────────────────────────────
  const [storyFormVersion, setStoryFormVersion] = useState(0);
  const [initialStoryData, setInitialStoryData] = useState(null); // pre-fill for form
  const [storyDraftInput, setStoryDraftInput] = useState(null);   // last draft-scored story
  const [storyDraftResult, setStoryDraftResult] = useState(null); // draft score result
  const [storyAISuggestion, setStoryAISuggestion] = useState(null);
  const [storyAILoading, setStoryAILoading] = useState(false);
  const [storyAIError, setStoryAIError] = useState(null);
  const [confirmedStory, setConfirmedStory] = useState(null);     // frozen for final scoring
  const [storyFinalResult, setStoryFinalResult] = useState(null); // final score result

  // ── Criteria flow state ──────────────────────────────────────────────────
  const [criteriaFormVersion, setCriteriaFormVersion] = useState(0);
  const [initialCriteriaData, setInitialCriteriaData] = useState(null);
  const [criteriaDraftInput, setCriteriaDraftInput] = useState(null);
  const [criteriaDraftResult, setCriteriaDraftResult] = useState(null);
  const [criteriaAISuggestion, setCriteriaAISuggestion] = useState(null);
  const [criteriaAILoading, setCriteriaAILoading] = useState(false);
  const [criteriaAIError, setCriteriaAIError] = useState(null);
  const [confirmedCriteria, setConfirmedCriteria] = useState(null);
  const [criteriaFinalResult, setCriteriaFinalResult] = useState(null);

  // ── XP / history / achievements ──────────────────────────────────────────
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

  // ── AI key handlers ───────────────────────────────────────────────────────

  const handleEnableAI = async (key) => {
    setAiStatus('validating');
    setAiError(null);
    try {
      await validateOpenAIKey(key);
      setAiApiKey(key);
      setAiEnabled(true);
      setAiStatus('enabled');
    } catch (err) {
      setAiStatus('error');
      setAiError(err?.message ?? 'Key validation failed.');
      setAiApiKey(null);
      setAiEnabled(false);
    }
  };

  const handleDisableAI = () => {
    setAiApiKey(null);
    setAiEnabled(false);
    setAiStatus('idle');
    setAiError(null);
    setStoryAISuggestion(null);
    setCriteriaAISuggestion(null);
  };

  // ── Story draft scoring ───────────────────────────────────────────────────

  const handleScoreDraftStory = (story) => {
    const scoreResult = scoreStory(story);
    setStoryDraftInput(story);
    setStoryDraftResult(scoreResult);
    setStoryAISuggestion(null);
    setStoryAIError(null);
    // Reset any previous final/confirmed state when re-scoring draft
    setConfirmedStory(null);
    setStoryFinalResult(null);

    scrollToPageBottom();
  };

  const handleImproveStoryWithAI = async () => {
    if (!aiEnabled || !aiApiKey) return;
    setStoryAILoading(true);
    setStoryAIError(null);
    try {
      const suggestion = await improveStoryWithAI({
        story: storyDraftInput,
        draftScore: storyDraftResult?.totalScore,
        breakdown: storyDraftResult?.breakdown,
        apiKey: aiApiKey,
      });
      setStoryAISuggestion(suggestion);
    } catch (err) {
      setStoryAIError(err?.message ?? 'AI improvement failed.');
    } finally {
      setStoryAILoading(false);
    }
  };

  // Apply AI suggestion by pre-filling the story form
  const handleApplyStorySuggestion = () => {
    if (!storyAISuggestion?.suggestion) return;
    setInitialStoryData(storyAISuggestion.suggestion);
    setStoryFormVersion(prev => prev + 1);
    setStoryAISuggestion(null);
    setStoryDraftResult(null);
    setStoryDraftInput(null);
  };

  const handleConfirmStory = () => {
    // Freeze the last draft-scored story as the confirmed text
    setConfirmedStory(storyDraftInput);
  };

  const handleScoreFinalStory = () => {
    const scoreResult = scoreStory(confirmedStory);
    setStoryFinalResult(scoreResult);
    // Move to criteria phase
    setInitialCriteriaData(null);
    setCriteriaFormVersion(prev => prev + 1);
    setCriteriaDraftResult(null);
    setCriteriaDraftInput(null);
    setConfirmedCriteria(null);
    setCriteriaFinalResult(null);
    setCriteriaAISuggestion(null);
    setPhase('criteria');
    scrollToPageBottom();
  };

  // ── Criteria draft scoring ────────────────────────────────────────────────

  const handleScoreDraftCriteria = (criteriaData) => {
    const { criteria, format } = criteriaData;
    const scoreResult = scoreCriteria(criteria, confirmedStory?.soThat, format);
    setCriteriaDraftInput({ criteria, format });
    setCriteriaDraftResult(scoreResult);
    setCriteriaAISuggestion(null);
    setCriteriaAIError(null);
    setConfirmedCriteria(null);
    setCriteriaFinalResult(null);

    scrollToPageBottom();
  };

  const handleImproveCriteriaWithAI = async () => {
    if (!aiEnabled || !aiApiKey) return;
    setCriteriaAILoading(true);
    setCriteriaAIError(null);
    try {
      const suggestion = await improveCriteriaWithAI(
        buildImproveCriteriaRequest(criteriaDraftInput, criteriaDraftResult, confirmedStory, aiApiKey),
      );
      setCriteriaAISuggestion(markCriteriaSuggestionsPending(suggestion));
    } catch (err) {
      setCriteriaAIError(err?.message ?? 'AI improvement failed.');
    } finally {
      setCriteriaAILoading(false);
    }
  };

  // Apply AI suggestion by pre-filling the criteria form
  const handleApplyCriteriaSuggestion = () => {
    if (!criteriaAISuggestion?.suggestions) return;
    const improved = criteriaAISuggestion.suggestions.map(s => s.improved);
    setInitialCriteriaData({
      criteria: improved,
      format: criteriaDraftInput?.format ?? 'gherkin',
    });
    setCriteriaFormVersion(prev => prev + 1);
    setCriteriaAISuggestion(null);
    setCriteriaDraftResult(null);
    setCriteriaDraftInput(null);
  };

  // Apply one AI criteria suggestion by replacing the associated original criterion.
  const handleApplySingleCriteriaSuggestion = (suggestionIndex) => {
    const suggestion = criteriaAISuggestion?.suggestions?.[suggestionIndex];
    if (!suggestion || suggestion.applied || !criteriaDraftInput?.criteria) return;

    const updatedCriteriaData = buildAppliedCriteriaData(criteriaDraftInput, suggestion, suggestionIndex);
    if (!updatedCriteriaData) return;

    setInitialCriteriaData(updatedCriteriaData);
    setCriteriaFormVersion(prev => prev + 1);
    setCriteriaDraftInput(updatedCriteriaData);

    setCriteriaAISuggestion(prev => {
      if (!prev?.suggestions) return null;
      return {
        ...prev,
        suggestions: prev.suggestions.map((item, idx) => (
          idx === suggestionIndex ? { ...item, applied: true } : item
        )),
      };
    });
  };

  const handleConfirmCriteria = () => {
    setConfirmedCriteria(criteriaDraftInput);
  };

  // Final criteria scoring: award XP and save history here
  const handleScoreFinalCriteria = () => {
    const { criteria, format } = confirmedCriteria;
    const scoreResult = scoreCriteria(criteria, confirmedStory?.soThat, format);
    setCriteriaFinalResult(scoreResult);

    const storyXP = storyFinalResult.totalScore;
    const criteriaXP = scoreResult.totalScore;

    // Award XP (story + criteria together, only now)
    setTotalXP(prev => prev + storyXP + criteriaXP);

    // Check achievements
    const storyNewAchievements = checkAchievements(
      storyFinalResult.totalScore,
      storyFinalResult.wordCount,
      storyHistory,
    );
    const criteriaNewAchievements = checkCriteriaAchievements(
      scoreResult.totalScore,
      criteria.length,
      scoreResult.breakdown,
    );
    const allNew = [...storyNewAchievements, ...criteriaNewAchievements];
    const earnedIds = new Set(allAchievements.map(a => a.id));
    const fresh = allNew.filter(a => !earnedIds.has(a.id));

    setAchievements(fresh);
    if (fresh.length > 0) {
      setAllAchievements(prev => [...prev, ...fresh]);
    }

    // Save history with final values
    const entry = {
      ...confirmedStory,
      criteria,
      criteriaFormat: format,
      storyScore: storyFinalResult.totalScore,
      criteriaScore: scoreResult.totalScore,
      combinedScore: storyFinalResult.totalScore + scoreResult.totalScore,
      storyDraftScore: storyDraftResult?.totalScore ?? null,
      criteriaDraftScore: criteriaDraftResult?.totalScore ?? null,
      timestamp: Date.now(),
    };
    setStoryHistory(prev => [...prev, entry]);

    setPhase('complete');
      scrollToPageBottom();
  };

  // ── Navigation helpers ────────────────────────────────────────────────────

  const handleStartNew = () => {
    setPhase('story');
    setInitialStoryData(null);
    setStoryFormVersion(prev => prev + 1);
    setCriteriaFormVersion(prev => prev + 1);
    setStoryDraftInput(null);
    setStoryDraftResult(null);
    setStoryAISuggestion(null);
    setStoryAILoading(false);
    setStoryAIError(null);
    setConfirmedStory(null);
    setStoryFinalResult(null);
    setInitialCriteriaData(null);
    setCriteriaDraftInput(null);
    setCriteriaDraftResult(null);
    setCriteriaAISuggestion(null);
    setCriteriaAILoading(false);
    setCriteriaAIError(null);
    setConfirmedCriteria(null);
    setCriteriaFinalResult(null);
    setAchievements([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadStoryFromHistory = (story) => {
    handleStartNew();
    setInitialStoryData(getStoryFields(story));
    setStoryFormVersion(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadCriteriaFromHistory = (story) => {
    if (shouldHydrateStoryFromHistory({ confirmedStory, storyFinalResult, storyDraftInput, storyDraftResult })) {
      const storyObj = getStoryFields(story);
      setConfirmedStory(storyObj);
      setStoryDraftInput(storyObj);
      setStoryFinalResult({ totalScore: story.storyScore ?? 0, breakdown: {}, wordCount: 0 });
    } else if (!confirmedStory && storyDraftInput) {
      // If user has only draft story state, keep their own draft as the criteria anchor.
      setConfirmedStory(storyDraftInput);
    }

    setInitialCriteriaData({
      criteria: Array.isArray(story.criteria) ? story.criteria : [],
      format: story.criteriaFormat === 'bullet' ? 'bullet' : 'gherkin',
    });
    setCriteriaFormVersion(prev => prev + 1);
    setCriteriaDraftResult(null);
    setCriteriaDraftInput(null);
    setConfirmedCriteria(null);
    setCriteriaFinalResult(null);
    setCriteriaAISuggestion(null);
    setStoryAISuggestion(null);
    setAchievements([]);
    setPhase('criteria');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveHistoryItem = (timestamp) => {
    setStoryHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  };

  const handleClearHistory = () => {
    setStoryHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AppHeader storyHistoryLength={storyHistory.length} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <ProgressBar totalXP={totalXP} allAchievements={allAchievements} />
        </div>

        <AIAccessPanel
          aiEnabled={aiEnabled}
          aiStatus={aiStatus}
          aiError={aiError}
          onEnable={handleEnableAI}
          onDisable={handleDisableAI}
        />

        <StoryPhaseSection
          phase={phase}
          confirmedStory={confirmedStory}
          storyFormVersion={storyFormVersion}
          handleScoreDraftStory={handleScoreDraftStory}
          initialStoryData={initialStoryData}
          storyDraftResult={storyDraftResult}
          storyAISuggestion={storyAISuggestion}
          handleApplyStorySuggestion={handleApplyStorySuggestion}
          setStoryAISuggestion={setStoryAISuggestion}
          storyAIError={storyAIError}
          aiEnabled={aiEnabled}
          handleImproveStoryWithAI={handleImproveStoryWithAI}
          storyAILoading={storyAILoading}
          handleConfirmStory={handleConfirmStory}
          handleScoreFinalStory={handleScoreFinalStory}
          storyFinalResult={storyFinalResult}
        />

        <StoryFinalSection
          storyFinalResult={storyFinalResult}
          phase={phase}
          storyDraftResult={storyDraftResult}
        />

        <CriteriaPhaseSection
          phase={phase}
          confirmedStory={confirmedStory}
          confirmedCriteria={confirmedCriteria}
          criteriaFormVersion={criteriaFormVersion}
          handleScoreDraftCriteria={handleScoreDraftCriteria}
          initialCriteriaData={initialCriteriaData}
          criteriaDraftResult={criteriaDraftResult}
          criteriaAISuggestion={criteriaAISuggestion}
          handleApplyCriteriaSuggestion={handleApplyCriteriaSuggestion}
          handleApplySingleCriteriaSuggestion={handleApplySingleCriteriaSuggestion}
          setCriteriaAISuggestion={setCriteriaAISuggestion}
          criteriaAIError={criteriaAIError}
          aiEnabled={aiEnabled}
          handleImproveCriteriaWithAI={handleImproveCriteriaWithAI}
          criteriaAILoading={criteriaAILoading}
          handleConfirmCriteria={handleConfirmCriteria}
          handleScoreFinalCriteria={handleScoreFinalCriteria}
          criteriaFinalResult={criteriaFinalResult}
        />

        <CompletePhaseSection
          phase={phase}
          criteriaFinalResult={criteriaFinalResult}
          criteriaDraftResult={criteriaDraftResult}
          storyFinalResult={storyFinalResult}
          confirmedStory={confirmedStory}
          confirmedCriteria={confirmedCriteria}
          achievements={achievements}
          handleStartNew={handleStartNew}
        />

        <HistorySection
          storyHistory={storyHistory}
          handleRemoveHistoryItem={handleRemoveHistoryItem}
          handleClearHistory={handleClearHistory}
          handleLoadStoryFromHistory={handleLoadStoryFromHistory}
          handleLoadCriteriaFromHistory={handleLoadCriteriaFromHistory}
        />

        <IntroSection phase={phase} storyDraftResult={storyDraftResult} />
      </main>

      <AppFooter />
    </div>
  );
}

export default App;
