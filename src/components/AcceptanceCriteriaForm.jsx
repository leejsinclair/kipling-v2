import { useEffect, useState } from 'react';

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

const TEMPLATE_STORAGE_KEY = 'acceptanceCriteriaTemplates';
const MIN_CRITERIA_FIELDS = 3;
const MAX_CRITERIA_FIELDS = 5;

const DEFAULT_TEMPLATES = {
  gherkin: [
    {
      id: 'gui',
      label: 'GUI Changes',
      criteria: [
        'Given I am on the target screen\nWhen I perform the UI action\nThen the expected visual state is shown',
        'Given the UI is loading data\nWhen the request is in progress\nThen I see an accessible loading indicator',
        'Given an invalid UI input\nWhen I submit the form\nThen I see a clear validation message next to the field'
      ]
    },
    {
      id: 'api',
      label: 'API / Backend',
      criteria: [
        'Given a valid request payload\nWhen the API endpoint is called\nThen the server returns a 2xx response with the expected schema',
        'Given a request with missing required fields\nWhen the API endpoint is called\nThen the server returns a 4xx error with validation details',
        'Given an authenticated user without required permissions\nWhen they call the endpoint\nThen the server returns an authorization error'
      ]
    },
    {
      id: 'database',
      label: 'Database Features',
      criteria: [
        'Given a valid create operation\nWhen data is saved\nThen a new record is persisted with all required fields',
        'Given an update operation\nWhen a record is modified\nThen only the targeted fields are changed and the audit timestamp is updated',
        'Given a foreign key constraint\nWhen invalid related data is submitted\nThen the transaction is rejected and no partial write occurs'
      ]
    },
    {
      id: 'auth',
      label: 'Authentication & Access',
      criteria: [
        'Given a registered user with valid credentials\nWhen they sign in\nThen they are redirected to the authorized landing page',
        'Given a user enters invalid credentials\nWhen they submit the sign-in form\nThen they see an authentication error without exposing sensitive details',
        'Given a user lacks required role permissions\nWhen they attempt a restricted action\nThen access is denied and the action is not executed'
      ]
    },
    {
      id: 'search',
      label: 'Search & Filtering',
      criteria: [
        'Given a dataset is available\nWhen I enter a search term\nThen results show only matching records',
        'Given filters are applied\nWhen I combine multiple filter values\nThen the results satisfy all selected filters',
        'Given no records match the query\nWhen the search is executed\nThen an empty-state message is shown with guidance'
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      criteria: [
        'Given a business event triggers a notification\nWhen processing completes\nThen the user receives the correct in-app or email message',
        'Given notification preferences are configured\nWhen an event occurs\nThen delivery follows the selected channels and timing rules',
        'Given notification delivery fails\nWhen retries are attempted\nThen failure is logged and the user is not sent duplicate messages'
      ]
    },
    {
      id: 'reporting',
      label: 'Reporting & Export',
      criteria: [
        'Given report filters are selected\nWhen I generate a report\nThen totals and records reflect the selected filters',
        'Given report data is displayed\nWhen I export to CSV\nThen the file includes expected columns in the correct order',
        'Given report generation exceeds a normal wait time\nWhen I request the report\nThen I receive progress feedback and completion status'
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow & Approvals',
      criteria: [
        'Given a request is submitted\nWhen workflow rules are evaluated\nThen the request is routed to the correct approver',
        'Given an approver rejects a request\nWhen they provide a reason\nThen the requester sees the rejection reason and updated status',
        'Given a request is approved\nWhen final approval is completed\nThen downstream actions are triggered and status is marked complete'
      ]
    }
  ],
  bullet: [
    {
      id: 'gui',
      label: 'GUI Changes',
      criteria: [
        'The user can complete the primary UI flow using visible and labeled controls.',
        'The system must show a loading state while UI data is being fetched.',
        'The system must display clear inline validation for invalid user input.'
      ]
    },
    {
      id: 'api',
      label: 'API / Backend',
      criteria: [
        'The system must return a successful 2xx response with the documented payload for valid API requests.',
        'The system must return a 4xx response with actionable validation errors for invalid input.',
        'The system must enforce authentication and authorization before protected backend operations.'
      ]
    },
    {
      id: 'database',
      label: 'Database Features',
      criteria: [
        'The system must persist valid records with all required database fields.',
        'The system must maintain data integrity by enforcing uniqueness and relational constraints.',
        'The system must roll back partial writes when a transaction fails.'
      ]
    },
    {
      id: 'auth',
      label: 'Authentication & Access',
      criteria: [
        'The user can sign in with valid credentials and reach the correct authorized landing page.',
        'The system must deny access to protected actions when the user lacks required permissions.',
        'The system must show clear sign-in errors without exposing sensitive security information.'
      ]
    },
    {
      id: 'search',
      label: 'Search & Filtering',
      criteria: [
        'The user can search records and only matching results are displayed.',
        'The user can apply multiple filters and the system must combine them correctly.',
        'The system must display a helpful empty state when no search results are found.'
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications',
      criteria: [
        'The system must send notifications when configured business events occur.',
        'The user can manage notification channel preferences and delivery follows those settings.',
        'The system must prevent duplicate notifications during retry or failure handling.'
      ]
    },
    {
      id: 'reporting',
      label: 'Reporting & Export',
      criteria: [
        'The user can generate reports that reflect selected date ranges and filters.',
        'The user can export report results and the file must contain expected columns and values.',
        'The system must provide progress or completion feedback for long-running report generation.'
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow & Approvals',
      criteria: [
        'The system must route submitted requests to approvers based on configured workflow rules.',
        'The user can approve or reject requests and a reason is captured for rejected items.',
        'The system must update workflow status history for each approval decision.'
      ]
    }
  ]
};

function normalizeCriteria(criteriaList) {
  const trimmed = criteriaList
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_CRITERIA_FIELDS);

  const padded = [...trimmed];
  while (padded.length < MIN_CRITERIA_FIELDS) {
    padded.push('');
  }
  return padded;
}

function loadSavedTemplates() {
  const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((template) => (
      template &&
      typeof template.id === 'string' &&
      typeof template.name === 'string' &&
      (template.format === 'gherkin' || template.format === 'bullet') &&
      Array.isArray(template.criteria)
    ));
  } catch {
    return [];
  }
}

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
  const [savedTemplates, setSavedTemplates] = useState(() => loadSavedTemplates());
  const [templateName, setTemplateName] = useState('');
  const [selectedSavedTemplateId, setSelectedSavedTemplateId] = useState('');

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  const applyTemplateCriteria = (templateCriteria) => {
    setCriteria(normalizeCriteria(templateCriteria));
    setHints({});
  };

  const handleCriterionChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);

    setHints((prev) => ({ ...prev, [index]: null }));
  };

  const addCriterion = () => {
    if (criteria.length < MAX_CRITERIA_FIELDS) {
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

  const handleSaveTemplate = () => {
    const filledCriteria = criteria.filter(c => c.trim());
    if (filledCriteria.length === 0) return;

    const name = templateName.trim() || `${format === 'gherkin' ? 'Gherkin' : 'Bullet'} Template`;
    const newTemplate = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      format,
      criteria: filledCriteria,
      createdAt: Date.now()
    };

    setSavedTemplates((prev) => [newTemplate, ...prev]);
    setTemplateName('');
    setSelectedSavedTemplateId(newTemplate.id);
  };

  const handleApplyDefaultTemplate = (templateId) => {
    const template = DEFAULT_TEMPLATES[format].find(item => item.id === templateId);
    if (!template) return;
    applyTemplateCriteria(template.criteria);
  };

  const handleApplySavedTemplate = () => {
    if (!selectedSavedTemplateId) return;
    const template = savedTemplates.find(item => item.id === selectedSavedTemplateId);
    if (!template) return;

    setFormat(template.format);
    applyTemplateCriteria(template.criteria);
  };

  const handleDeleteSavedTemplate = () => {
    if (!selectedSavedTemplateId) return;
    setSavedTemplates((prev) => prev.filter(item => item.id !== selectedSavedTemplateId));
    setSelectedSavedTemplateId('');
  };

  const handleBlur = (index, value) => {
    const hint = getHintForCriterion(value, format);
    setHints(prev => ({ ...prev, [index]: hint }));
  };

  const filledCount = criteria.filter(c => c.trim()).length;

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4 mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            ✅ Write Acceptance Criteria
          </h2>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer whitespace-nowrap">
            <span>Bullet point format</span>
            <input
              type="checkbox"
              checked={format === 'bullet'}
              onChange={(e) => {
                setFormat(e.target.checked ? 'bullet' : 'gherkin');
                setHints({});
              }}
              aria-label="Bullet point format"
              className="h-4 w-4 accent-blue-600"
            />
          </label>
        </div>
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

        {/* Format Example */}
        <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded mb-4">
          <ul className="mt-2 space-y-1">
            {FORMAT_HINTS[format].map((tip, i) => (
              <li key={i} className="text-xs text-gray-500 flex gap-1">
                <span>•</span><span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Default {format === 'gherkin' ? 'Gherkin' : 'Bullet'} Templates:
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_TEMPLATES[format].map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleApplyDefaultTemplate(template.id)}
                  className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Use {template.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-slate-700 px-3 py-2 rounded">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Saved Templates:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name (optional)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={filledCount === 0}
                className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Current
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedSavedTemplateId}
                onChange={(e) => setSelectedSavedTemplateId(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                aria-label="Saved templates"
              >
                <option value="">Select a saved template</option>
                {savedTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.format})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleApplySavedTemplate}
                disabled={!selectedSavedTemplateId}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load
              </button>
              <button
                type="button"
                onClick={handleDeleteSavedTemplate}
                disabled={!selectedSavedTemplateId}
                className="px-3 py-2 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
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
      {criteria.length < MAX_CRITERIA_FIELDS && (
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
