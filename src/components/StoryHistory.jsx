import { useEffect, useMemo, useRef, useState } from 'react';
import { scoreStory } from '../scoringEngine';
import { scoreCriteria, scoreSingleCriterion } from '../criteriaScoring';

export default function StoryHistory({
  stories,
  onLoadStory,
  onLoadCriteria,
  onRemoveStory,
  onClearHistory
}) {
  const [selectedStory, setSelectedStory] = useState(null);
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
  const [exportViewMode, setExportViewMode] = useState('preview');
  const [copyStatus, setCopyStatus] = useState('');
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusedElementRef = useRef(null);

  const recalculatedScores = useMemo(() => {
    if (!selectedStory) return null;

    const storyInput = {
      asA: selectedStory.asA || '',
      iWant: selectedStory.iWant || '',
      soThat: selectedStory.soThat || ''
    };
    const criteria = Array.isArray(selectedStory.criteria) ? selectedStory.criteria : [];
    const format = selectedStory.criteriaFormat === 'bullet' ? 'bullet' : 'gherkin';

    const storyResult = scoreStory(storyInput);
    const criteriaResult = scoreCriteria(criteria, storyInput.soThat, format);
    const perCriterionScores = criteria.map((criterion) => (
      scoreSingleCriterion(criterion, format, storyInput.soThat)
    ));

    return {
      storyResult,
      criteriaResult,
      perCriterionScores,
      combinedTotal: storyResult.totalScore + criteriaResult.totalScore,
      format
    };
  }, [selectedStory]);

  useEffect(() => {
    if (selectedStory) {
      previousFocusedElementRef.current = document.activeElement;
      closeButtonRef.current?.focus();
      return;
    }

    const previousElement = previousFocusedElementRef.current;
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  }, [selectedStory]);

  const closeModal = () => {
    setSelectedStory(null);
  };

  const handleModalKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const dialogElement = dialogRef.current;
    if (!dialogElement) {
      return;
    }

    const focusableElements = Array.from(
      dialogElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const getScoreColorClass = (score, maxScore) => {
    const ratio = maxScore > 0 ? score / maxScore : 0;
    if (ratio >= 0.75) {
      return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/20 dark:border-green-800';
    }
    if (ratio >= 0.4) {
      return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-900/20 dark:border-orange-800';
    }
    return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-900/20 dark:border-red-800';
  };

  const metricLabels = {
    format: 'Format',
    testability: 'Testability',
    specificity: 'Specificity',
    alignment: 'Alignment'
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const buildGherkinLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return '';

    if (/^given\b/i.test(trimmed)) {
      return trimmed.replace(/^given\b\s*/i, '**Given** ');
    }
    if (/^when\b/i.test(trimmed)) {
      return trimmed.replace(/^when\b\s*/i, '**When** ');
    }
    if (/^then\b/i.test(trimmed)) {
      return trimmed.replace(/^then\b\s*/i, '**Then** ');
    }
    if (/^and\b/i.test(trimmed)) {
      return trimmed.replace(/^and\b\s*/i, '    **And** ');
    }

    return trimmed;
  };

  const exportPreviewText = useMemo(() => {
    const sections = [];

    stories.slice().reverse().forEach((story, index) => {
      const criteria = Array.isArray(story.criteria) ? story.criteria : [];
      const isGherkin = story.criteriaFormat !== 'bullet';

      if (index > 0) {
        sections.push('');
        sections.push('---');
      }

      sections.push('');
      sections.push(`## Story ${index + 1}`);
  
      sections.push('');
      sections.push(`**As a** ${story.asA || ''}`);
      sections.push('');
      sections.push(`**I want** ${story.iWant || ''}`);
      sections.push('');
      sections.push(`**So that** ${story.soThat || ''}`);

      sections.push('');
      sections.push('### Acceptance Criteria');

      if (criteria.length === 0) {
        sections.push('No criteria provided.');
        return;
      }

      criteria.forEach((criterion, criterionIndex) => {
        sections.push('');
        sections.push('');
        sections.push(`**Criterion ${criterionIndex + 1}**`);
        sections.push('');

        if (isGherkin) {
          criterion
            .split('\n')
            .map(buildGherkinLine)
            .filter(Boolean)
            .forEach((line) => sections.push(line));
        } else {
          sections.push(criterion.trim());
        }
      });
    });

    return sections.join('\n');
  }, [stories]);

  const handleCopyExportPreview = async () => {
    try {
      await navigator.clipboard.writeText(exportPreviewText);
      setCopyStatus('Copied to clipboard');
    } catch {
      setCopyStatus('Copy failed — select and copy manually');
    }
  };

  const buildFormattedExportHtml = () => {
    const storyBlocks = stories
      .slice()
      .reverse()
      .map((story, index) => {
        const criteria = Array.isArray(story.criteria) ? story.criteria : [];
        const isGherkin = story.criteriaFormat !== 'bullet';

        const criteriaHtml = criteria.length === 0
          ? '<p>No criteria provided.</p>'
          : criteria.map((criterion, criterionIndex) => {
              if (!isGherkin) {
                return `
                  <h5>Criterion ${criterionIndex + 1}</h5>
                  <p>${escapeHtml(criterion.trim())}</p>
                `;
              }

              const gherkinLines = criterion
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const keywordMatch = line.match(/^(Given|When|Then|And)\b/i);
                  if (!keywordMatch) {
                    return `<p>${escapeHtml(line)}</p>`;
                  }

                  const keyword = keywordMatch[1];
                  const rest = line.replace(/^(Given|When|Then|And)\b\s*/i, '');
                  const indentStyle = keyword.toLowerCase() === 'and' ? ' style="margin-left: 1.5rem;"' : '';
                  return `<p${indentStyle}><strong>${escapeHtml(keyword)}</strong>${rest ? ` ${escapeHtml(rest)}` : ''}</p>`;
                })
                .join('');

              return `
                <h4>Criterion ${criterionIndex + 1}</h4>
                ${gherkinLines}
              `;
            }).join('');

        return `
          ${index > 0 ? '<hr />' : ''}
          <h2>Story ${index + 1}</h2>
          <p><strong>As a</strong> ${escapeHtml(story.asA || '')}</p>
          <p><strong>I want</strong> ${escapeHtml(story.iWant || '')}</p>
          <p><strong>So that</strong> ${escapeHtml(story.soThat || '')}</p>
          <h3>Acceptance Criteria</h3>
          ${criteriaHtml}
        `;
      })
      .join('');

    return `
      ${storyBlocks}
    `;
  };

  const handleCopyFormattedExport = async () => {
    const html = buildFormattedExportHtml();
    try {
      if (navigator.clipboard.write && typeof window.ClipboardItem === 'function') {
        const clipboardItem = new window.ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([exportPreviewText], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
        setCopyStatus('Formatted content copied');
        return;
      }

      await navigator.clipboard.writeText(exportPreviewText);
      setCopyStatus('Formatted copy fallback: markdown copied');
    } catch {
      setCopyStatus('Copy failed — select and copy manually');
    }
  };

  const renderInlineMarkdown = (text) => {
    const segments = text.split(/(\*\*[^*]+\*\*)/g);
    return segments.map((segment, index) => {
      if (/^\*\*[^*]+\*\*$/.test(segment)) {
        return <strong key={index}>{segment.slice(2, -2)}</strong>;
      }
      return <span key={index}>{segment}</span>;
    });
  };

  const renderMarkdownPreview = () => {
    const lines = exportPreviewText.split('\n');

    return (
      <div className="h-[420px] overflow-y-auto p-3 border border-gray-300 rounded-md bg-white text-black">
        {lines.map((line, index) => {
          if (!line.trim()) {
            return <div key={index} className="h-3" />;
          }

          if (line.startsWith('# ')) {
            return <h1 key={index} className="text-xl font-bold">{renderInlineMarkdown(line.slice(2))}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={index} className="text-lg font-bold">{renderInlineMarkdown(line.slice(3))}</h2>;
          }
          if (line.startsWith('### ')) {
            return <h3 key={index} className="text-base font-semibold">{renderInlineMarkdown(line.slice(4))}</h3>;
          }
          if (line.startsWith('#### ')) {
            return <h4 key={index} className="text-sm font-semibold">{renderInlineMarkdown(line.slice(5))}</h4>;
          }

          if (line.trim() === '---') {
            return <hr key={index} className="my-4 border-gray-300 dark:border-slate-600" />;
          }

          const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
          const content = line.trimStart();

          return (
            <p key={index} className={`text-sm whitespace-pre-wrap ${leadingSpaces >= 4 ? 'pl-6' : ''}`}>
              {renderInlineMarkdown(content)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderGherkinCriterion = (criterion) => {
    const lines = criterion
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return (
      <div className="space-y-1">
        {lines.map((line, lineIndex) => {
          const keywordMatch = line.match(/^(Given|When|Then|And)\b/i);
          if (!keywordMatch) {
            return (
              <p key={lineIndex} className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {line}
              </p>
            );
          }

          const keyword = keywordMatch[1];
          const rest = line.replace(/^(Given|When|Then|And)\b\s*/i, '');
          const isAndLine = keyword.toLowerCase() === 'and';

          return (
            <p
              key={lineIndex}
              className={`text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ${isAndLine ? 'pl-6' : ''}`}
            >
              <strong>{keyword}</strong>
              {rest ? ` ${rest}` : ''}
            </p>
          );
        })}
      </div>
    );
  };

  if (!stories || stories.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Story History</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearHistory}
            className="text-sm border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExportPreviewOpen(true);
              setExportViewMode('preview');
              setCopyStatus('');
            }}
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Preview
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {stories.slice().reverse().map((story) => (
          <div
            key={story.timestamp}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(story.timestamp).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">As a</span>{' '}
                  <span className="text-gray-600">{story.asA}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">I want</span>{' '}
                  <span className="text-gray-600">{story.iWant}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">So that</span>{' '}
                  <span className="text-gray-600">{story.soThat}</span>
                </p>
              </div>
              <div className="ml-4">
                <div className={`text-2xl font-bold ${
                  (story.combinedScore || story.score || 0) >= 50 ? 'text-green-600' : 
                  (story.combinedScore || story.score || 0) >= 35 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {story.combinedScore || story.score || 0}
                </div>
                <div className="text-xs text-gray-500 text-center">pts</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => setSelectedStory(story)}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                View Details
              </button>
              <button
                type="button"
                onClick={() => onLoadStory?.(story)}
                className="px-3 py-1.5 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors"
              >
                Load Story
              </button>
              <button
                type="button"
                onClick={() => onLoadCriteria?.(story)}
                disabled={!Array.isArray(story.criteria) || story.criteria.length === 0}
                className="px-3 py-1.5 text-xs rounded border border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load Criteria
              </button>
              <button
                type="button"
                onClick={() => onRemoveStory?.(story.timestamp)}
                className="px-3 py-1.5 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedStory && recalculatedScores && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Story details"
          onClick={closeModal}
          onKeyDown={handleModalKeyDown}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Story Details</h4>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Story Score (recalculated)</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {recalculatedScores.storyResult.totalScore}
                  </p>
                </div>
                <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Criteria Score (recalculated)</p>
                  <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {recalculatedScores.criteriaResult.totalScore}
                  </p>
                </div>
                <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Combined (recalculated)</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {recalculatedScores.combinedTotal}
                  </p>
                </div>
              </div>

              <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Full Story</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  As a {selectedStory.asA}, I want {selectedStory.iWant} so that {selectedStory.soThat}.
                </p>
              </div>

              <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Acceptance Criteria</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Format: {recalculatedScores.format}
                  </p>
                </div>

                {Array.isArray(selectedStory.criteria) && selectedStory.criteria.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selectedStory.criteria.map((criterion, index) => (
                      <div key={`${selectedStory.timestamp}-${index}`} className="rounded border border-gray-200 dark:border-slate-700 p-3">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Criterion {index + 1}</p>
                          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                            {recalculatedScores.perCriterionScores[index].score}/{recalculatedScores.perCriterionScores[index].maxScore} • {recalculatedScores.perCriterionScores[index].grade}
                          </p>
                        </div>
                        {recalculatedScores.format === 'gherkin' ? (
                          renderGherkinCriterion(criterion)
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{criterion}</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(recalculatedScores.perCriterionScores[index].breakdown).map(([key, metric]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold ${getScoreColorClass(metric.score, metric.maxScore)}`}
                            >
                              {metricLabels[key] || key} {metric.score}/{metric.maxScore}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No criteria were saved for this story.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isExportPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Export preview"
          onClick={() => setIsExportPreviewOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confluence Export Preview</h4>
              <button
                type="button"
                onClick={() => setIsExportPreviewOpen(false)}
                className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                aria-label="Close export preview"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Copy this content and paste directly into Confluence.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExportViewMode('preview')}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    exportViewMode === 'preview'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 dark:border-slate-600 dark:text-slate-200'
                  }`}
                >
                  Markdown Preview
                </button>
                <button
                  type="button"
                  onClick={() => setExportViewMode('raw')}
                  className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                    exportViewMode === 'raw'
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 dark:border-slate-600 dark:text-slate-200'
                  }`}
                >
                  Raw Markdown
                </button>
              </div>

              {exportViewMode === 'raw' ? (
                <textarea
                  readOnly
                  value={exportPreviewText}
                  className="w-full h-[420px] p-3 text-sm border border-gray-300 rounded-md bg-white text-black font-mono"
                />
              ) : (
                renderMarkdownPreview()
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">{copyStatus}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyExportPreview}
                    className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Copy Markdown
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyFormattedExport}
                    className="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Copy Formatted
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
