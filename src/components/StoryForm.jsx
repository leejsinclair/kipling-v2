import { useState } from 'react';

const VALUE_KEYWORDS = [
  'increase', 'reduce', 'improve', 'save', 'enable', 'simplify', 'automate', 'streamline', 'deliver'
];

function buildFieldFeedback(score, hints) {
  return {
    score,
    hints
  };
}

function scoreAsAField(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return buildFieldFeedback(0, ['Add the user role or persona who needs this feature.']);
  }

  const wordCount = cleanText.split(/\s+/).length;
  let score = 6;
  const hints = [];

  if (wordCount >= 2) {
    score += 2;
  } else {
    hints.push('Be more specific than a single-word role when possible.');
  }

  if (/user|person|someone/i.test(cleanText)) {
    hints.push('Consider a more specific persona (for example: account admin, release manager).');
  } else {
    score += 2;
  }

  if (hints.length === 0) {
    hints.push('Great role clarity.');
  }

  return buildFieldFeedback(Math.min(10, score), hints);
}

function scoreIWantField(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return buildFieldFeedback(0, ['Describe the capability or action you want.']);
  }

  const wordCount = cleanText.split(/\s+/).length;
  const hasActionVerb = /^(to\s+)?(create|view|edit|export|track|manage|search|filter|share|receive|update|generate)\b/i.test(cleanText);
  let score = 5;
  const hints = [];

  if (hasActionVerb) {
    score += 3;
  } else {
    hints.push('Start with a clear action (for example: "to export", "to track").');
  }

  if (wordCount >= 4) {
    score += 2;
  } else {
    hints.push('Add a bit more context so the intent is specific.');
  }

  if (hints.length === 0) {
    hints.push('Clear goal statement.');
  }

  return buildFieldFeedback(Math.min(10, score), hints);
}

function scoreSoThatField(text) {
  const cleanText = text.trim();
  if (!cleanText) {
    return buildFieldFeedback(0, ['Add the business or user value this outcome creates.']);
  }

  const words = cleanText.split(/\s+/);
  const lowerText = cleanText.toLowerCase();
  const hasValueKeyword = VALUE_KEYWORDS.some((keyword) => lowerText.includes(keyword));
  let score = 5;
  const hints = [];

  if (hasValueKeyword) {
    score += 3;
  } else {
    hints.push('Use a value-oriented outcome (for example: increase, reduce, save, improve).');
  }

  if (words.length >= 6) {
    score += 2;
  } else {
    hints.push('Add a more concrete outcome so the value is measurable.');
  }

  if (hints.length === 0) {
    hints.push('Strong value statement.');
  }

  return buildFieldFeedback(Math.min(10, score), hints);
}

export default function StoryForm({ onSubmit }) {
  const [asA, setAsA] = useState('');
  const [iWant, setIWant] = useState('');
  const [soThat, setSoThat] = useState('');
  const [fieldFeedback, setFieldFeedback] = useState({
    asA: null,
    iWant: null,
    soThat: null
  });
  
  const wordCount = `${asA} ${iWant} ${soThat}`.trim().split(/\s+/).filter(w => w).length;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (asA.trim() && iWant.trim() && soThat.trim()) {
      onSubmit({ asA, iWant, soThat });
    }
  };
  
  const handleReset = () => {
    setAsA('');
    setIWant('');
    setSoThat('');
    setFieldFeedback({ asA: null, iWant: null, soThat: null });
  };

  const handleBlur = (fieldName, value) => {
    let feedback;

    if (fieldName === 'asA') {
      feedback = scoreAsAField(value);
    }
    if (fieldName === 'iWant') {
      feedback = scoreIWantField(value);
    }
    if (fieldName === 'soThat') {
      feedback = scoreSoThatField(value);
    }

    setFieldFeedback(prev => ({
      ...prev,
      [fieldName]: feedback
    }));
  };
  
  const fieldScoreColor = (score) =>
    score >= 8 ? 'text-green-600 dark:text-green-400' : score >= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Craft Your User Story</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Fill in all three fields to create a complete agile user story
        </p>
      </div>
      
      <div>
        <label htmlFor="asA" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          As a... <span className="text-red-500">*</span>
        </label>
        <input
          id="asA"
          type="text"
          value={asA}
          onChange={(e) => setAsA(e.target.value)}
          onBlur={(e) => handleBlur('asA', e.target.value)}
          placeholder="e.g., product manager, developer, user"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        {fieldFeedback.asA && (
          <div className="mt-2 text-sm">
            <p className={`font-medium ${fieldScoreColor(fieldFeedback.asA.score)}`}>Field score: {fieldFeedback.asA.score}/10</p>
            <p className="text-gray-600 dark:text-gray-400">Hint: {fieldFeedback.asA.hints[0]}</p>
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="iWant" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          I want... <span className="text-red-500">*</span>
        </label>
        <input
          id="iWant"
          type="text"
          value={iWant}
          onChange={(e) => setIWant(e.target.value)}
          onBlur={(e) => handleBlur('iWant', e.target.value)}
          placeholder="e.g., to export user stories as CSV"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        {fieldFeedback.iWant && (
          <div className="mt-2 text-sm">
            <p className={`font-medium ${fieldScoreColor(fieldFeedback.iWant.score)}`}>Field score: {fieldFeedback.iWant.score}/10</p>
            <p className="text-gray-600 dark:text-gray-400">Hint: {fieldFeedback.iWant.hints[0]}</p>
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="soThat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          So that... <span className="text-red-500">*</span>
        </label>
        <textarea
          id="soThat"
          value={soThat}
          onChange={(e) => setSoThat(e.target.value)}
          onBlur={(e) => handleBlur('soThat', e.target.value)}
          placeholder="e.g., I can share them with my team in our backlog management tool"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        {fieldFeedback.soThat && (
          <div className="mt-2 text-sm">
            <p className={`font-medium ${fieldScoreColor(fieldFeedback.soThat.score)}`}>Field score: {fieldFeedback.soThat.score}/10</p>
            <p className="text-gray-600 dark:text-gray-400">Hint: {fieldFeedback.soThat.hints[0]}</p>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Word count: <span className="font-semibold">{wordCount}</span>
          <span className="text-gray-400 dark:text-gray-500 ml-2">(ideal: 18-40)</span>
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Score My Story
        </button>
      </div>
    </form>
  );
}
