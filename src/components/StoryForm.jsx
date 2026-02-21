import { useState } from 'react';

const FILLER_WORDS = ['basically', 'kind of', 'sort of', 'stuff', 'things', 'very', 'really', 'just', 'maybe', 'perhaps', 'probably'];
const VAGUE_PHRASES = ["it's better", "it's easier", "it works", "make it better", "be better"];
const VALUE_PHRASES = ['increase', 'reduce', 'enable', 'improve', 'save', 'automate', 'simplify', 'enhance', 'allow', 'ensure'];

function getAsAHint(value) {
  if (!value.trim()) return '';
  const generic = ['user', 'developer', 'admin', 'person'];
  if (generic.includes(value.trim().toLowerCase())) {
    return '💡 Tip: Be more specific – e.g., "admin user", "new customer", or "product manager"';
  }
  if (value.trim().split(/\s+/).length === 1) {
    return '💡 Tip: Consider adding context – e.g., "logged-in user" or "first-time visitor"';
  }
  return '';
}

function getIWantHint(value) {
  if (!value.trim()) return '';
  const lower = value.toLowerCase();
  const words = lower.split(/\s+/);
  const fillers = FILLER_WORDS.filter(w => words.includes(w));
  if (fillers.length > 0) {
    return `💡 Tip: Remove filler words ("${fillers.join('", "')}") for a clearer feature statement`;
  }
  if (words.length < 3) {
    return '💡 Tip: Add more detail about what you want to do or achieve';
  }
  return '';
}

function getSoThatHint(value) {
  if (!value.trim()) return '';
  const lower = value.toLowerCase();
  if (VAGUE_PHRASES.some(p => lower.includes(p))) {
    return '💡 Tip: Use specific value verbs like "reduce", "increase", "enable", or "save time"';
  }
  if (!VALUE_PHRASES.some(p => lower.includes(p))) {
    if (value.trim().split(/\s+/).length < 5) {
      return '💡 Tip: Describe the business value – start with a verb like "reduce", "enable", or "improve"';
    }
  }
  return '';
}

export default function StoryForm({ onSubmit }) {
  const [asA, setAsA] = useState('');
  const [iWant, setIWant] = useState('');
  const [soThat, setSoThat] = useState('');
  const [hints, setHints] = useState({ asA: '', iWant: '', soThat: '' });
  
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
    setHints({ asA: '', iWant: '', soThat: '' });
  };

  const handleBlur = (field, value) => {
    const hintFns = { asA: getAsAHint, iWant: getIWantHint, soThat: getSoThatHint };
    setHints(prev => ({ ...prev, [field]: hintFns[field](value) }));
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
        {hints.asA && <p className="mt-1 text-xs text-amber-600">{hints.asA}</p>}
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
        {hints.iWant && <p className="mt-1 text-xs text-amber-600">{hints.iWant}</p>}
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
        {hints.soThat && <p className="mt-1 text-xs text-amber-600">{hints.soThat}</p>}
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
