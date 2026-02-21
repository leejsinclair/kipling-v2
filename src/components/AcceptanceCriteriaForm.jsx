import { useState } from 'react';

const FORMAT_HINTS = {
  gherkin: [
    'Start with "Given" to describe the context or precondition.',
    'Use "When" to describe the action or event that triggers the scenario.',
    'Use "Then" to describe the expected observable outcome.',
    'Use "And" to continue a Given, When, or Then step.'
  ],
  bullet: [
    'Start with "The system must..." or "The user can..." for clear ownership.',
    'Describe a single, testable behaviour per criterion.',
    'Reference specific UI elements (button, field, message) when possible.',
    'Avoid vague words like "basically", "sort of", or "maybe".'
  ]
};

/**
 * Generate a context-sensitive hint for a single criterion string.
 * Returns null when the criterion is empty.
 */
function getHintForCriterion(criterion, format) {
  const text = criterion.trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  if (format === 'gherkin') {
    if (!lower.startsWith('given') && !lower.startsWith('when') && !lower.startsWith('then') && !lower.startsWith('and')) {
      return 'Try starting with "Given", "When", or "Then" to follow Gherkin format.';
    }
    if (lower.startsWith('given') && !lower.includes('when') && !lower.includes('then')) {
      return 'Add a "When" clause to describe the action, and a "Then" clause for the outcome.';
    }
    if (lower.startsWith('when') && !lower.includes('then')) {
      return 'Add a "Then" clause to describe the expected observable outcome.';
    }
  }

  if (format === 'bullet') {
    if (!lower.startsWith('the system') && !lower.startsWith('the user') &&
        !lower.startsWith('user can') && !lower.startsWith('system must')) {
      return 'Start with "The system must..." or "The user can..." for a clear, testable statement.';
    }
  }

  const VAGUE_WORDS = ['basically', 'sort of', 'kind of', 'maybe', 'probably', 'might', 'somewhat'];
  const hasVague = VAGUE_WORDS.some(w => lower.includes(w));
  if (hasVague) {
    return 'Replace vague words with specific, measurable language.';
  }

  if (text.split(/\s+/).length < 5) {
    return 'This criterion is quite short – add more detail to make it testable.';
  }

  return null;
}

export default function AcceptanceCriteriaForm({ onSubmit, storyText }) {
  const [criteria, setCriteria] = useState(['', '', '']);
  const [format, setFormat] = useState('gherkin');
  const [hints, setHints] = useState({});

  const handleCriterionChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);

    setHints((prev) => ({ ...prev, [index]: null }));
  };

  const addCriterion = () => {
    if (criteria.length < 5) {
      setCriteria([...criteria, '']);
      setHints((prev) => ({ ...prev, [criteria.length]: null }));
    }
  };

  const removeCriterion = (index) => {
    if (criteria.length > 1) {
      const newCriteria = criteria.filter((_, i) => i !== index);
      setCriteria(newCriteria);
      setHints((prev) => {
        const next = {};
        newCriteria.forEach((_, i) => {
          const oldIndex = i >= index ? i + 1 : i;
          next[i] = prev[oldIndex] || null;
        });
        return next;
      });
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
    setHints({});
  };

  const handleBlur = (index, value) => {
    const hint = getHintForCriterion(value, format);
    setHints(prev => ({ ...prev, [index]: hint }));
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
            onClick={() => { setFormat('gherkin'); setHints({}); }}
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
            onClick={() => { setFormat('bullet'); setHints({}); }}
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
          <ul className="mt-2 space-y-1">
            {FORMAT_HINTS[format].map((tip, i) => (
              <li key={i} className="text-xs text-gray-500 flex gap-1">
                <span>•</span><span>{tip}</span>
              </li>
            ))}
          </ul>
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
                onBlur={() => handleBlur(index, criterion)}
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
            {hints[index] && (
              <p style={{backgroundColor: 'rgba(0,0,0,0.1)'}} className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1" role="note">
                💡 {hints[index]}
              </p>
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
