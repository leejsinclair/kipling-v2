import { useState } from 'react';

export default function StoryAndCriteriaExport({ story, criteria }) {
  const [copied, setCopied] = useState(false);

  const formatExport = () => {
    const { asA, iWant, soThat } = story;
    const storyLine = `As a ${asA}, I want ${iWant} so that ${soThat}.`;
    
    let export_text = storyLine + '\n\n';
    export_text += 'Acceptance Criteria:\n\n';
    
    criteria.forEach((criterion, index) => {
      export_text += `${index + 1}. ${criterion}\n\n`;
    });
    
    return export_text.trim();
  };

  const handleCopy = async () => {
    const text = formatExport();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        📋 Export Story + Criteria
      </h3>

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <div className="text-sm font-mono whitespace-pre-wrap text-gray-800">
          {formatExport()}
        </div>
      </div>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className={`w-full py-3 px-6 rounded-md font-medium transition-all ${
          copied
            ? 'bg-green-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {copied ? (
          <span className="flex items-center justify-center gap-2">
            <span>✓</span>
            <span>Copied to Clipboard!</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>📋</span>
            <span>Copy to Clipboard</span>
          </span>
        )}
      </button>

      {/* Format Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>
          This format works well with Confluence, Jira, Azure DevOps, and Linear.
          Just paste it directly into your tool.
        </p>
      </div>
    </div>
  );
}
