import { useState } from 'react';

export default function StoryForm({ onSubmit }) {
  const [asA, setAsA] = useState('');
  const [iWant, setIWant] = useState('');
  const [soThat, setSoThat] = useState('');
  
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
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Craft Your User Story</h2>
        <p className="text-gray-600 text-sm">
          Fill in all three fields to create a complete agile user story
        </p>
      </div>
      
      <div>
        <label htmlFor="asA" className="block text-sm font-medium text-gray-700 mb-1">
          As a... <span className="text-red-500">*</span>
        </label>
        <input
          id="asA"
          type="text"
          value={asA}
          onChange={(e) => setAsA(e.target.value)}
          placeholder="e.g., product manager, developer, user"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label htmlFor="iWant" className="block text-sm font-medium text-gray-700 mb-1">
          I want... <span className="text-red-500">*</span>
        </label>
        <input
          id="iWant"
          type="text"
          value={iWant}
          onChange={(e) => setIWant(e.target.value)}
          placeholder="e.g., to export user stories as CSV"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div>
        <label htmlFor="soThat" className="block text-sm font-medium text-gray-700 mb-1">
          So that... <span className="text-red-500">*</span>
        </label>
        <textarea
          id="soThat"
          value={soThat}
          onChange={(e) => setSoThat(e.target.value)}
          placeholder="e.g., I can share them with my team in our backlog management tool"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          required
        />
      </div>
      
      <div className="flex items-center justify-between pt-2">
        <div className="text-sm text-gray-600">
          Word count: <span className="font-semibold">{wordCount}</span>
          <span className="text-gray-400 ml-2">(ideal: 18-40)</span>
        </div>
      </div>
      
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          Score My Story
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
