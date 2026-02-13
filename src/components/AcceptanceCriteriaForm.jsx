import { useState } from 'react';

export default function AcceptanceCriteriaForm({ onSubmit, storyText }) {
  const [criteria, setCriteria] = useState(['', '', '']);
  const [format, setFormat] = useState('gherkin');

  const handleCriterionChange = (index, value) => {
    const newCriteria = [...criteria];
    newCriteria[index] = value;
    setCriteria(newCriteria);
  };

  const addCriterion = () => {
    if (criteria.length < 5) {
      setCriteria([...criteria, '']);
    }
  };

  const removeCriterion = (index) => {
    if (criteria.length > 1) {
      const newCriteria = criteria.filter((_, i) => i !== index);
      setCriteria(newCriteria);
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
  };

  const filledCount = criteria.filter(c => c.trim()).length;

  const formatExamples = {
    gherkin: {
      title: 'Gherkin Format',
      example: 'Given I am logged in\nWhen I click the export button\nThen I see a download confirmation'
    },
    bullet: {
      title: 'Bullet-Point Format',
      example: 'The system must validate user input\nThe user can export data as CSV\nThe page displays error messages'
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ✅ Write Acceptance Criteria
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          Define testable conditions that specify when this story is complete
        </p>
        
        {/* Story Context */}
        {storyText && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Your Story:</span> {storyText}
            </p>
          </div>
        )}

        {/* Format Selection */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => setFormat('gherkin')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              format === 'gherkin'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Gherkin (Given/When/Then)
          </button>
          <button
            type="button"
            onClick={() => setFormat('bullet')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              format === 'bullet'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bullet-Point
          </button>
        </div>

        {/* Format Example */}
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {formatExamples[format].title} Example:
          </p>
          <p className="text-xs text-gray-600 whitespace-pre-line font-mono">
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
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Criterion {index + 1} {index < 1 && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
              <textarea
                id={`criterion-${index}`}
                value={criterion}
                onChange={(e) => handleCriterionChange(index, e.target.value)}
                placeholder={
                  format === 'gherkin'
                    ? index === 0 ? 'Given...' : index === 1 ? 'When...' : 'Then...'
                    : 'The system/user must...'
                }
                rows={2}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required={index === 0}
              />
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Remove criterion"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Criterion Button */}
      {criteria.length < 5 && (
        <button
          type="button"
          onClick={addCriterion}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + Add Another Criterion (max 5)
        </button>
      )}

      {/* Criteria Count */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600">
          Criteria filled: <span className="font-semibold">{filledCount}</span>
          <span className="text-gray-400 ml-2">(recommended: 3-5)</span>
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
          className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
