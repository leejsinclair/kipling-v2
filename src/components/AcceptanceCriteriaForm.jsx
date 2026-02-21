import { useState } from 'react';

function buildCriterionFeedback(score, hints) {
  return { score, hints };
}

function scoreGherkinCriterion(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return buildCriterionFeedback(0, ['Add a criterion using Given/When/Then structure.']);
  }

  const lowerText = cleanText.toLowerCase();
  const hasGiven = lowerText.includes('given');
  const hasWhen = lowerText.includes('when');
  const hasThen = lowerText.includes('then');

  let score = 2;
  const hints = [];

  if (hasGiven) score += 2;
  else hints.push('Add a "Given" context to explain the starting state.');

  if (hasWhen) score += 3;
  else hints.push('Add a "When" action that triggers behavior.');

  if (hasThen) score += 3;
  else hints.push('Add a "Then" outcome that is observable and testable.');

  if (hints.length === 0) {
    hints.push('Great Gherkin structure.');
  }

  return buildCriterionFeedback(Math.min(10, score), hints);
}

function scoreBulletCriterion(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return buildCriterionFeedback(0, ['Add a concise bullet criterion with actor, action, and expected outcome.']);
  }

  const lowerText = cleanText.toLowerCase();
  const words = cleanText.split(/\s+/).length;

  const hasActor =
    lowerText.startsWith('the system') ||
    lowerText.startsWith('the user') ||
    lowerText.startsWith('user') ||
    lowerText.startsWith('system') ||
    lowerText.startsWith('application') ||
    lowerText.startsWith('page');

  const hasAction =
    lowerText.includes(' must ') ||
    lowerText.includes(' can ') ||
    lowerText.includes(' should ') ||
    lowerText.includes(' is able to ') ||
    lowerText.includes(' allows ');

  const hasOutcome =
    lowerText.includes('display') ||
    lowerText.includes('show') ||
    lowerText.includes('error') ||
    lowerText.includes('success') ||
    lowerText.includes('confirmation') ||
    lowerText.includes('visible') ||
    lowerText.includes('saved') ||
    lowerText.includes('export');

  let score = 2;
  const hints = [];

  if (hasActor) score += 2;
  else hints.push('Start with a clear actor (for example: "The system" or "The user").');

  if (hasAction) score += 3;
  else hints.push('Include an explicit action (for example: "must", "can", or "should").');

  if (hasOutcome) score += 2;
  else hints.push('Include a testable outcome (for example: displays a confirmation message).');

  if (words >= 6) score += 1;
  else hints.push('Add a little more detail so this can be tested consistently.');

  if (hints.length === 0) {
    hints.push('Strong bullet criterion.');
  }

  return buildCriterionFeedback(Math.min(10, score), hints);
}

export default function AcceptanceCriteriaForm({ onSubmit, storyText }) {
  const [criteria, setCriteria] = useState(['', '', '']);
  const [format, setFormat] = useState('gherkin');
  const [criterionFeedback, setCriterionFeedback] = useState([null, null, null]);

  const clearFeedbackForCurrentCriteria = () => {
    setCriterionFeedback(criteria.map(() => null));
  };

  const handleCriterionChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);

    setCriterionFeedback((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  const handleCriterionBlur = (index, value) => {
    const feedback = format === 'gherkin'
      ? scoreGherkinCriterion(value)
      : scoreBulletCriterion(value);

    setCriterionFeedback((prev) => {
      const next = [...prev];
      next[index] = feedback;
      return next;
    });
  };

  const handleFormatChange = (nextFormat) => {
    setFormat(nextFormat);
    clearFeedbackForCurrentCriteria();
  };

  const addCriterion = () => {
    if (criteria.length < 5) {
      setCriteria([...criteria, '']);
      setCriterionFeedback([...criterionFeedback, null]);
    }
  };

  const removeCriterion = (index) => {
    if (criteria.length > 1) {
      const newCriteria = criteria.filter((_, i) => i !== index);
      setCriteria(newCriteria);
      setCriterionFeedback(criterionFeedback.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const filledCriteria = criteria.filter(c => c.trim());
    if (filledCriteria.length > 0) {
      onSubmit({ criteria: filledCriteria, format });
    }
  };

  const handleReset = () => {
    setCriteria(['', '', '']);
    setFormat('gherkin');
    setCriterionFeedback([null, null, null]);
  };

  const filledCount = criteria.filter(c => c.trim()).length;

  const formatExamples = {
    gherkin: {
      title: 'Gherkin Format',
      example: 'Given I am logged in as an admin\nWhen I click the export button\nThen I see a download confirmation message'
    },
    bullet: {
      title: 'Bullet-Point Format',
      example: 'The system must validate user input\nThe user can export data as CSV\nThe page displays error messages'
    }
  };

  const criterionScoreColor = (score) =>
    score >= 8 ? 'text-green-600 dark:text-green-400' : score >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          ✅ Write Acceptance Criteria
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Define testable conditions that specify when this story is complete
        </p>
        
        {/* Story Context */}
        {storyText && (
          <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Your Story:</span> {storyText}
            </p>
          </div>
        )}

        {/* Format Selection */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => handleFormatChange('gherkin')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              format === 'gherkin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Gherkin (Given/When/Then)
          </button>
          <button
            type="button"
            onClick={() => handleFormatChange('bullet')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              format === 'bullet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            Bullet-Point
          </button>
        </div>

        {/* Format Example */}
        <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded mb-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {formatExamples[format].title} Example:
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line font-mono">
            {formatExamples[format].example}
          </p>
        </div>
      </div>

      {/* Criteria Inputs */}
      <div className="space-y-3">
        {criteria.map((criterion, index) => (
          <div key={index} className="relative">
            <label 
              htmlFor={`criterion-${index}`} 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Criterion {index + 1} {index < 1 && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
              <textarea
                id={`criterion-${index}`}
                value={criterion}
                onChange={(e) => handleCriterionChange(index, e.target.value)}
                onBlur={(e) => handleCriterionBlur(index, e.target.value)}
                placeholder={
                  format === 'gherkin'
                    ? 'Given [context]\nWhen [action]\nThen [outcome]'
                    : 'The system/user must...'
                }
                rows={format === 'gherkin' ? 3 : 2}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required={index === 0}
              />
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  aria-label="Remove criterion"
                >
                  ✕
                </button>
              )}
            </div>
            {criterionFeedback[index] && (
              <div className="mt-2 text-sm">
                <p className={`font-medium ${criterionScoreColor(criterionFeedback[index].score)}`}>Criterion score: {criterionFeedback[index].score}/10</p>
                <p className="text-gray-600 dark:text-gray-400">Hint: {criterionFeedback[index].hints[0]}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Criterion Button */}
      {criteria.length < 5 && (
        <button
          type="button"
          onClick={addCriterion}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          + Add Another Criterion (max 5)
        </button>
      )}

      {/* Criteria Count */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Criteria filled: <span className="font-semibold">{filledCount}</span>
          <span className="text-gray-400 dark:text-gray-500 ml-2">(recommended: 3-5)</span>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={filledCount === 0}
        >
          Score My Criteria
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-md font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
