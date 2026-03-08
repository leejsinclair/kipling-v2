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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const errMsg = body?.error?.message || response.statusText || 'unknown error';
      throw new Error(errMsg);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return parseStoryResponse(text);
  } catch (err) {
    if (err?.type) throw err;
    throw normalizeError(err);
  }
}

/**
 * Requests AI-suggested improvements for acceptance criteria.
 * Returns the improvement payload or throws a normalized error.
 */
export async function improveCriteriaWithAI({ criteria, format, draftScore, breakdown, apiKey }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw { type: 'invalid_key', message: 'No API key provided.' };
  }

  if (isMockKey(apiKey)) {
    mockValidate(apiKey);
    return mockCriteriaImproveResponse;
  }

  const prompt = buildCriteriaPrompt({ criteria, format, draftScore, breakdown });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const errMsg = body?.error?.message || response.statusText || 'unknown error';
      throw new Error(errMsg);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    return parseCriteriaResponse(text);
  } catch (err) {
    if (err?.type) throw err;
    throw normalizeError(err);
  }
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

Return a JSON object with this exact shape:
{
  "issues": ["<issue1>", "<issue2>"],
  "suggestion": {
    "asA": "<improved persona>",
    "iWant": "<improved feature>",
    "soThat": "<improved outcome>"
  },
  "rationale": [
    { "criterion": "<scoring dimension>", "reason": "<why this improves the score>" }
  ]
}

Respond with raw JSON only, no markdown.`;
}

function buildCriteriaPrompt({ criteria, format, draftScore, breakdown }) {
  const criteriaText = Array.isArray(criteria)
    ? criteria.map((c, i) => `  ${i + 1}. ${c}`).join('\n')
    : String(criteria);

  const breakdownText = breakdown
    ? Object.entries(breakdown)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n')
    : '  (not available)';

  return `You are an agile coach helping improve acceptance criteria written in ${format} format.

Current criteria:
${criteriaText}

Draft score: ${draftScore}/100
Score breakdown:
${breakdownText}

Return a JSON object with this exact shape:
{
  "suggestions": [
    {
      "original": "<original criterion>",
      "improved": "<improved criterion>"
    }
  ],
  "guidance": ["<tip1>", "<tip2>"]
}

Respond with raw JSON only, no markdown.`;
}

// ---------------------------------------------------------------------------
// Response parsers (real API path)
// ---------------------------------------------------------------------------

function parseStoryResponse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      issues: ['Could not parse AI response'],
      suggestion: null,
      rationale: [],
    };
  }
}

function parseCriteriaResponse(text) {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      suggestions: [],
      guidance: ['Could not parse AI response'],
    };
  }
}
