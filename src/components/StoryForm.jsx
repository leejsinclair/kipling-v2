import { useState } from 'react';
import { scoreSoThatStatement } from '../scoringEngine';

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
  const [soThatRating, setSoThatRating] = useState(null);
  
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
    setSoThatRating(null);
  };

  const handleBlur = (field, value) => {
    const hintFns = { asA: getAsAHint, iWant: getIWantHint, soThat: getSoThatHint };
    setHints(prev => ({ ...prev, [field]: hintFns[field](value) }));
    
    // Score "So that" field on blur
    if (field === 'soThat') {
      const rating = scoreSoThatStatement(value);
      setSoThatRating(rating);
    }
  };
  
  const handleSoThatChange = (value) => {
    setSoThat(value);
    // Clear rating when user starts editing again
    setSoThatRating(null);
  };

  const getSoThatTooltipContent = (rating) => {
    if (!rating) return null;

    if (rating.score >= 17) {
      // Excellent
      return {
        good: [
          '"reduce response time by 50% and increase satisfaction"',
          '"save $10,000 monthly in operational costs"',
          '"increase conversion rate from 2% to 5%"'
        ],
        avoid: [
          '"make things better" (too vague)',
          '"increase happiness" (not business-focused)',
          '"improve performance" (what metric?)'
        ]
      };
    } else if (rating.score >= 13) {
      // Good - needs more specificity
      return {
        good: [
          'Add specific metric: "reduce response time by 50%"',
          'Include numbers: "increase conversion rate from 2% to 5%"',
          'Be specific: "save 10 hours per week in manual processing"'
        ],
        avoid: [
          '"improve things by 20%" (20% of what?)',
          '"increase productivity" (how measured?)',
          'Generic percentages without context'
        ]
      };
    } else if (rating.score >= 9) {
      // Fair - needs business metrics
      return {
        good: [
          'Use business metrics: response time, conversion rate, cost',
          'Add measurable outcomes with numbers or percentages',
          'Focus on business impact, not emotional language'
        ],
        avoid: [
          '"be happier" or "feel better" (emotional)',
          '"save time" (how much time?)',
          'Vague statements without metrics'
        ]
      };
    } else {
      // Needs work
      return {
        good: [
          'Start with action verb: reduce, increase, enable, improve',
          'Add business metric: time, cost, revenue, conversion',
          'Include specific numbers: "by 50%", "from X to Y"'
        ],
        avoid: [
          'Emotional language: happiness, joy, peace, harmony',
          'Vague phrases: "it\'s better", "works well"',
          'No metrics or numbers at all'
        ]
      };
    }
  };
  
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
        <div className="flex items-center gap-2 mb-1">
          <label htmlFor="soThat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            So that... <span className="text-red-500">*</span>
          </label>
          {soThatRating && (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  soThatRating.color === 'green'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : soThatRating.color === 'blue'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : soThatRating.color === 'yellow'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                }`}
              >
                {soThatRating.score}/{soThatRating.maxScore} • {soThatRating.grade}
              </span>
            </div>
          )}
        </div>
        <textarea
          id="soThat"
          value={soThat}
          onChange={(e) => handleSoThatChange(e.target.value)}
          onBlur={(e) => handleBlur('soThat', e.target.value)}
          placeholder="e.g., I can share them with my team in our backlog management tool"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
        {hints.soThat && <p className="mt-1 text-xs text-amber-600">{hints.soThat}</p>}
        {soThatRating && soThatRating.feedback && (
          <div className="mt-1 flex items-start gap-1">
            <p className="text-xs text-blue-600 dark:text-blue-400 flex-1">
              💡 {soThatRating.feedback}
            </p>
            <div className="group relative inline-block">
              <svg 
                className="w-4 h-4 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-help flex-shrink-0 mt-0.5" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {(() => {
                const tooltipContent = getSoThatTooltipContent(soThatRating);
                if (!tooltipContent) return null;
                return (
                  <div className="invisible group-hover:visible absolute left-0 bottom-full mb-2 w-80 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 border border-slate-700">
                    <div className="mb-2">
                      <div className="font-semibold text-green-400 mb-1">✓ {soThatRating.score >= 17 ? 'Excellent examples' : 'To improve'}:</div>
                      <ul className="list-disc list-inside space-y-1 text-gray-200">
                        {tooltipContent.good.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-red-400 mb-1">✗ Avoid:</div>
                      <ul className="list-disc list-inside space-y-1 text-gray-200">
                        {tooltipContent.avoid.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
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
