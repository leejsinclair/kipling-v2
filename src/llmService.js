/**
 * LLM Service for AI-assisted story and criteria improvement.
 *
 * API key is intentionally NOT logged, stored, or exported.
 * All functions accept the key at call-time; it is never cached in module scope.
 *
 * Test mode: pass "test-key" as apiKey to use deterministic mock responses
 * without making real network requests.
 */

import {
  mockStoryImproveResponse,
  mockCriteriaImproveResponse,
} from './test/fixtures/llmResponses.js';

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function normalizeError(err) {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('invalid_api_key') || msg.includes('incorrect api key') || msg.includes('invalid key')) {
    return { type: 'invalid_key', message: 'Invalid API key. Please check your key and try again.' };
  }
  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('insufficient_quota')) {
    return { type: 'quota', message: 'API quota exceeded or rate limit reached. Please try again later.' };
  }
  if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('econnreset')) {
    return { type: 'network', message: 'Network error. Please check your connection and try again.' };
  }
  return { type: 'unknown', message: 'An unexpected error occurred. Please try again.' };
}

const PLACEHOLDER_REGEX = /<[^>]+>|\b(issue\d+|tip\d+|criterion\d+)\b/i;
const GENERIC_TEMPLATE_PHRASES = [
  'specific issue',
  'improved persona',
  'improved feature',
  'measurable business outcome',
  'scoring dimension',
  'why this improves the score',
  'original criterion text',
  'improved criterion text',
  'specific tip',
];

// ---------------------------------------------------------------------------
// Mock helpers (used when apiKey === 'test-key' or 'test-quota' / 'test-network')
// ---------------------------------------------------------------------------

function isMockKey(apiKey) {
  return (
    apiKey === 'test-key' ||
    apiKey === 'test-quota' ||
    apiKey === 'test-network'
  );
}

function mockValidate(apiKey) {
  if (apiKey === 'test-key') return { valid: true };
  if (apiKey === 'test-quota') throw new Error('quota exceeded');
  if (apiKey === 'test-network') throw new Error('network error, failed to fetch');
  throw new Error('invalid_api_key');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates the given OpenAI API key by making a lightweight models list call.
 * Returns { valid: true } on success.
 * Throws a normalized error object on failure.
 */
export async function validateOpenAIKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw { type: 'invalid_key', message: 'No API key provided.' };
  }

  if (isMockKey(apiKey)) {
    mockValidate(apiKey); // may throw
    return { valid: true };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const errMsg = body?.error?.message || response.statusText || 'unknown error';
      throw new Error(errMsg);
    }

    return { valid: true };
  } catch (err) {
    throw normalizeError(err);
  }
}

/**
 * Requests AI-suggested improvements for a user story.
 * Returns the improvement payload or throws a normalized error.
 */
export async function improveStoryWithAI({ story, draftScore, breakdown, apiKey }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw { type: 'invalid_key', message: 'No API key provided.' };
  }

  if (isMockKey(apiKey)) {
    mockValidate(apiKey);
    return mockStoryImproveResponse;
  }

  const prompt = buildStoryPrompt({ story, draftScore, breakdown });
  const retryPrompt = buildStoryRetryPrompt({ story, draftScore, breakdown });

  try {
    const text = await runChatCompletion({ apiKey, prompt, temperature: 0.2 });
    const parsed = parseStoryResponse(text, story);
    if (parsed) return parsed;

    // Retry once with an explicit correction prompt if the first payload was template-like.
    const retryText = await runChatCompletion({ apiKey, prompt: retryPrompt, temperature: 0.1 });
    const retryParsed = parseStoryResponse(retryText, story);
    if (retryParsed) return retryParsed;

    return buildStoryFallback(story, breakdown);
  } catch (err) {
    if (err?.type) throw err;
    throw normalizeError(err);
  }
}

/**
 * Requests AI-suggested improvements for acceptance criteria.
 * Returns the improvement payload or throws a normalized error.
 */
export async function improveCriteriaWithAI({ criteria, format, draftScore, breakdown, hintTargets, story, apiKey }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw { type: 'invalid_key', message: 'No API key provided.' };
  }

  if (isMockKey(apiKey)) {
    mockValidate(apiKey);
    return mockCriteriaImproveResponse;
  }

  const prompt = buildCriteriaPrompt({ criteria, format, draftScore, breakdown, hintTargets, story });
  const retryPrompt = buildCriteriaRetryPrompt({ criteria, format, draftScore, breakdown, hintTargets, story });

  try {
    const text = await runChatCompletion({ apiKey, prompt, temperature: 0.2 });
    const parsed = parseCriteriaResponse(text, {
      criteria,
      format,
    });
    if (parsed) return parsed;

    // Retry once with stricter correction instructions.
    const retryText = await runChatCompletion({ apiKey, prompt: retryPrompt, temperature: 0.1 });
    const retryParsed = parseCriteriaResponse(retryText, {
      criteria,
      format,
    });
    if (retryParsed) return retryParsed;

    return buildCriteriaFallback(criteria, format);
  } catch (err) {
    if (err?.type) throw err;
    throw normalizeError(err);
  }
}

async function runChatCompletion({ apiKey, prompt, temperature }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an agile coaching assistant. Return valid JSON only. Never use placeholder tokens like <issue1>, <tip1>, or <improved outcome>. Use concrete, context-specific text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const errMsg = body?.error?.message || response.statusText || 'unknown error';
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ---------------------------------------------------------------------------
// Prompt builders (real API path)
// ---------------------------------------------------------------------------

function buildStoryPrompt({ story, draftScore, breakdown }) {
  const breakdownText = breakdown
    ? Object.entries(breakdown)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : '  (not available)';

  return `You are an agile coach helping improve a user story.

Current story:
  As a: ${story.asA}
  I want: ${story.iWant}
  So that: ${story.soThat}

Draft score: ${draftScore}/100
Score breakdown:
${breakdownText}

Return a JSON object with this exact shape and concrete values:
{
  "issues": ["Persona is too generic", "Outcome is not measurable"],
  "suggestion": {
    "asA": "customer support manager",
    "iWant": "to export weekly incident summaries",
    "soThat": "I can reduce weekly reporting time by 40%"
  },
  "rationale": [
    { "criterion": "soThatQuality", "reason": "Outcome includes a measurable target" }
  ]
}

Rules:
- Do not use placeholders, angle brackets, or generic template text.
- Ensure issues and rationale reference THIS story text.
- Ensure "soThat" is measurable and aligned with the story domain.

Respond with raw JSON only, no markdown.`;
}

function buildStoryRetryPrompt({ story, draftScore, breakdown }) {
  return `${buildStoryPrompt({ story, draftScore, breakdown })}

Your previous answer contained invalid/template values. Regenerate with concrete text only.`;
}

function buildCriteriaPrompt({ criteria, format, draftScore, breakdown, hintTargets, story }) {
  const criteriaText = Array.isArray(criteria)
    ? criteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n')
    : String(criteria);

  const breakdownText = breakdown
    ? Object.entries(breakdown)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : '  (not available)';

  const focusTips = buildCriteriaFocusTips({ format, breakdown });
  const scoringTargets = buildCriteriaScoringTargets({ breakdown, format });
  const explicitHints = Array.isArray(hintTargets) && hintTargets.length > 0
    ? hintTargets.map(h => `- ${h}`).join('\n')
    : '- (no additional hint targets provided)';

  const storyContext = story && typeof story === 'object'
    ? [
        'Story context (for alignment):',
        `  As a: ${story.asA || '(not provided)'}`,
        `  I want: ${story.iWant || '(not provided)'}`,
        `  So that: ${story.soThat || '(not provided)'}`,
      ].join('\n')
    : 'Story context (for alignment): (not provided)';

  return `You are an agile coach helping improve acceptance criteria written in ${format} format.

${storyContext}

Current criteria:
${criteriaText}

Draft score: ${draftScore}/100
Score breakdown:
${breakdownText}

Focus tips based on current scoring weaknesses:
${focusTips}

Scoring targets for this rewrite:
${scoringTargets}

Additional scoring hints from local engine:
${explicitHints}

Return a JSON object with this exact shape and concrete values:
{
  "suggestions": [
    {
      "original": "Given all required approvers have approved a request\nWhen the final approval is submitted\nThen the system marks the request status as Approved",
      "improved": "Given all required approvers have approved a request\nWhen the final approval is submitted by an authorized approver\nThen the system marks the request status as Approved and records the approval chain in the audit log with timestamps"
    }
  ],
  "guidance": [
    "Use a concrete trigger in the When step, including actor and action.",
    "Define an observable Then outcome with status change and notification/audit evidence."
  ]
}

Rules:
- Do not use placeholders or angle brackets.
- Keep improvements aligned with the provided criteria and format.
- Make outcomes observable and testable.
- Use the focus tips to prioritize your improvements.
- Optimize for measurable score uplift on testability, specificity, and alignment where weak.
- Keep each improved criterion concise (target 12-45 words) while preserving essential behavior.
- Prefer one primary behavior/outcome per criterion. If a criterion is overloaded, split into focused suggestions.
- For gherkin format, each suggested "improved" value must contain Given, When, and Then (And is optional).
- For gherkin format, each "original" value must reference a full criterion from the input list, not a single line fragment.

Respond with raw JSON only, no markdown.`;
}

function buildCriteriaRetryPrompt({ criteria, format, draftScore, breakdown, hintTargets, story }) {
  return `${buildCriteriaPrompt({ criteria, format, draftScore, breakdown, hintTargets, story })}

Your previous answer contained invalid/template values.
Regenerate with concrete text only and preserve full criterion scope.
Do not return Then-only fragments.
Ensure each improved suggestion would increase score versus its original criterion.`;
}

function buildCriteriaFocusTips({ format, breakdown }) {
  if (!breakdown || typeof breakdown !== 'object') {
    return [
      '- Improve testability by making outcomes observable in Then steps.',
      '- Improve alignment by connecting criteria to the story value outcome.',
    ].join('\n');
  }

  const tips = [];

  if ((breakdown.format ?? 0) < 8) {
    tips.push(
      format === 'gherkin'
        ? '- Format is weak: use complete Given/When/Then sequences and use And only to extend a step.'
        : '- Format is weak: start criteria with clear ownership (for example, "The system..." or "The user...").',
    );
  }
  if ((breakdown.testability ?? 0) < 10) {
    tips.push('- Testability is weak: specify observable outcomes (status, message, redirect, audit event, API response).');
  }
  if ((breakdown.specificity ?? 0) < 8) {
    tips.push('- Specificity is weak: replace vague words with concrete actors, actions, data, and expected results.');
  }
  if ((breakdown.alignment ?? 0) < 8) {
    tips.push('- Alignment is weak: tie each criterion to the story value and ensure outcomes support that value.');
  }
  if ((breakdown.completeness ?? 0) < 8) {
    tips.push('- Completeness is weak: cover happy path, validation/error path, and side effects (notifications/audit).');
  }

  if (tips.length === 0) {
    tips.push('- Preserve strengths and provide only high-impact refinements.');
    tips.push('- Avoid rewriting every criterion unless it clearly improves score dimensions.');
  }

  return tips.join('\n');
}

function buildCriteriaScoringTargets({ breakdown, format }) {
  const b = breakdown || {};
  const formatMax = String(format || '').toLowerCase() === 'gherkin' ? 5 : 4;
  const targets = [
    `- Format: current ${b.format ?? 0}/${formatMax}, target >= ${Math.min(formatMax, (b.format ?? 0) < formatMax ? (b.format ?? 0) + 1 : formatMax)}/${formatMax}`,
    `- Testability: current ${b.testability ?? 0}/3, target >= ${Math.min(3, (b.testability ?? 0) + 1)}/3`,
    `- Specificity: current ${b.specificity ?? 0}/3, target >= ${Math.min(3, (b.specificity ?? 0) + 1)}/3`,
    `- Alignment: current ${b.alignment ?? 0}/2, target >= ${Math.min(2, (b.alignment ?? 0) + 1)}/2`,
  ];

  return targets.join('\n');
}

// ---------------------------------------------------------------------------
// Response parsers (real API path)
// ---------------------------------------------------------------------------

function parseStoryResponse(text, story) {
  try {
    const parsed = parseJSONContent(text);
    if (!isValidStoryPayload(parsed)) return null;
    if (hasTemplateTokens(parsed)) return null;
    if (!isStorySuggestionDomainAligned(parsed?.suggestion, story)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCriteriaResponse(text, { criteria, format }) {
  try {
    const parsed = parseJSONContent(text);
    if (!isValidCriteriaPayload(parsed, { criteria, format })) return null;
    if (hasTemplateTokens(parsed)) return null;

    const filteredSuggestions = filterCriteriaSuggestions(parsed.suggestions, {
      criteria,
      format,
    });

    if (filteredSuggestions.length === 0) return null;

    return {
      ...parsed,
      suggestions: filteredSuggestions,
    };
  } catch {
    return null;
  }
}

function parseJSONContent(text) {
  const cleaned = String(text || '').replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

function isValidStoryPayload(value) {
  if (!value || typeof value !== 'object') return false;
  if (!Array.isArray(value.issues) || value.issues.length === 0) return false;
  if (!value.suggestion || typeof value.suggestion !== 'object') return false;
  const { asA, iWant, soThat } = value.suggestion;
  if (!isNonEmptyString(asA) || !isNonEmptyString(iWant) || !isNonEmptyString(soThat)) return false;
  if (!Array.isArray(value.rationale) || value.rationale.length === 0) return false;
  return value.rationale.every(item => (
    item && typeof item === 'object' && isNonEmptyString(item.criterion) && isNonEmptyString(item.reason)
  ));
}

function isValidCriteriaPayload(value) {
  if (!value || typeof value !== 'object') return false;
  if (!Array.isArray(value.suggestions) || value.suggestions.length === 0) return false;
  if (!Array.isArray(value.guidance) || value.guidance.length === 0) return false;
  const suggestionsOk = value.suggestions.every(item => (
    item && typeof item === 'object' && isNonEmptyString(item.original) && isNonEmptyString(item.improved)
  ));
  const guidanceOk = value.guidance.every(g => isNonEmptyString(g) && g.trim().length >= 10);
  const uniqueGuidance = new Set(value.guidance.map(g => g.trim().toLowerCase())).size;
  if (uniqueGuidance < 2) return false;
  return suggestionsOk && guidanceOk;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function hasTemplateTokens(value) {
  if (value == null) return false;
  if (typeof value === 'string') {
    const text = value.trim();
    if (PLACEHOLDER_REGEX.test(text)) return true;
    const lower = text.toLowerCase();
    return GENERIC_TEMPLATE_PHRASES.some(phrase => lower === phrase || lower.includes(`"${phrase}"`));
  }
  if (Array.isArray(value)) return value.some(hasTemplateTokens);
  if (typeof value === 'object') return Object.values(value).some(hasTemplateTokens);
  return false;
}

function filterCriteriaSuggestions(suggestions, { criteria, format }) {
  const sourceCriteria = Array.isArray(criteria) ? criteria.map(c => String(c || '').trim().toLowerCase()) : [];
  const sourceCriteriaNormalized = sourceCriteria.map(normalizeCriteriaTextForMatch);
  const isGherkin = String(format || '').toLowerCase() === 'gherkin';

  const validSuggestions = [];

  for (const suggestion of suggestions || []) {
    const original = suggestion?.original || '';
    const improved = suggestion?.improved || '';

    if (!isNonEmptyString(original) || !isNonEmptyString(improved)) continue;

    // Enforce richer structure for Gherkin so the model doesn't collapse to Then-only lines.
    if (isGherkin) {
      const originalLower = original.trim().toLowerCase();
      const originalNormalized = normalizeCriteriaTextForMatch(originalLower);

      if (/^then\b/i.test(original.trim()) || /^then\b/i.test(improved.trim())) continue;

      const hasGiven = /\bgiven\b/i.test(improved);
      const hasWhen = /\bwhen\b/i.test(improved);
      const hasThen = /\bthen\b/i.test(improved);
      if (!(hasGiven && hasWhen && hasThen)) continue;

      const matchedToSource = sourceCriteriaNormalized.some(src => (
        src.includes(originalNormalized) || originalNormalized.includes(src)
      ));
      if (!matchedToSource) continue;

      if (original.split(/\s+/).length < 8 || improved.split(/\s+/).length < 12) continue;
    }

    validSuggestions.push(suggestion);
  }

  return validSuggestions;
}

function normalizeCriteriaTextForMatch(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/["'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isStorySuggestionDomainAligned(suggestion, story) {
  if (!suggestion || !story) return true;
  const suggestionText = `${suggestion.asA} ${suggestion.iWant} ${suggestion.soThat}`.toLowerCase();
  const storyText = `${story.asA} ${story.iWant} ${story.soThat}`.toLowerCase();

  // Reject obvious cross-domain mismatches (common bad model drift).
  const websiteTerms = ['website', 'web page', 'page load', 'seo', 'conversion'];
  const constructionTerms = ['house', 'builder', 'building', 'construction', 'foundation'];
  const storyLooksConstruction = constructionTerms.some(t => storyText.includes(t));
  const suggestionLooksWebsite = websiteTerms.some(t => suggestionText.includes(t));

  if (storyLooksConstruction && suggestionLooksWebsite) return false;
  return true;
}

function buildStoryFallback(story, breakdown) {
  const asA = story?.asA || 'user';
  const iWant = story?.iWant || 'to complete a clearly defined task';
  const soThat = story?.soThat || 'I can achieve a measurable business outcome';
  const issues = [];

  if (typeof asA === 'string' && asA.trim().split(/\s+/).length < 2) {
    issues.push('Persona is too generic; add role context and responsibility.');
  }
  if (typeof soThat === 'string' && !/\d|percent|%|time|cost|revenue|conversion|speed|quality/i.test(soThat)) {
    issues.push('Value statement is not measurable; add a concrete metric or target.');
  }
  if (issues.length === 0) {
    issues.push('Clarify the user outcome with more specific scope and measurable impact.');
  }

  return {
    issues,
    suggestion: {
      asA: String(asA).trim(),
      iWant: String(iWant).trim(),
      soThat: String(soThat).trim(),
    },
    rationale: [
      {
        criterion: 'clarity',
        reason: 'Fallback keeps concrete language and avoids placeholder output when AI response is malformed.',
      },
      {
        criterion: 'soThatQuality',
        reason: 'Improvement guidance emphasizes measurable business outcomes.',
      },
      ...(breakdown?.length != null && breakdown.length < 8
        ? [{ criterion: 'length', reason: 'Add context to reach a more informative story length band.' }]
        : []),
    ],
  };
}

function buildCriteriaFallback(criteria, format) {
  const first = Array.isArray(criteria) && criteria.length > 0
    ? String(criteria[0]).trim()
    : 'Given a valid context, When an action occurs, Then the system shows an observable result';

  const improvedFallback = String(format || '').toLowerCase() === 'gherkin'
    ? 'Given a valid context and required preconditions, When the user performs the action, Then the system displays a specific, testable outcome and records any required audit event.'
    : 'The system should perform the action with a specific, testable outcome and any required audit or notification side effects.';

  return {
    suggestions: [
      {
        original: first,
        improved: improvedFallback,
      },
    ],
    guidance: [
      'Use full Given/When/Then structure in each criterion.',
      'State outcomes as observable UI or API behavior.',
    ],
  };
}
