/**
 * NLP Scoring Engine for Agile User Stories
 * Uses lightweight heuristics to score story quality
 */

// Value-oriented phrases that indicate good outcomes
const VALUE_PHRASES = [
  'increase', 'reduce', 'enable', 'improve', 'access', 'understand',
  'save', 'automate', 'simplify', 'enhance', 'provide', 'allow',
  'track', 'manage', 'control', 'optimize', 'optimise', 'streamline', 'eliminate',
  'achieve', 'ensure', 'maintain', 'deliver', 'create', 'view',
  'generate', 'decrease', 'minimize', 'minimise', 'maximize', 'maximise', 'accelerate'
];

// Filler words that should be penalized
const FILLER_WORDS = [
  'basically', 'kind of', 'sort of', 'stuff', 'things', 'very',
  'really', 'just', 'maybe', 'perhaps', 'probably'
];

// Vague phrases that reduce quality
const VAGUE_PHRASES = [
  "it's better", "it's easier", "it's good", "it works", "it's nice",
  "make it better", "be better", "be easier"
];

// Non-business or flowery language that should be avoided in "So that"
const NON_BUSINESS_TERMS = [
  'happiness', 'happy', 'happily', 'joy', 'joyful', 'wonderful', 'amazing',
  'fantastic', 'awesome', 'nice', 'pretty', 'beautiful', 'lovely',
  'house', 'home', 'family', 'love', 'peace', 'harmony', 'soul',
  'journey', 'adventure', 'dream', 'wish', 'hope', 'feel good',
  'protected', 'safe', 'safety', 'dangerous', 'elements', 'strong team',
  'live', 'living', 'thrive', 'flourish', 'blessed'
];

// Patterns that indicate flowery/emotional language
const FLOWERY_PATTERNS = [
  /\blive (in|with|among)\b/i,
  /\bprotected (from|against)\b/i,
  /\bdangerous\s+\w+/i,
  /\bstrong\s+(team|community|family)\b/i,
  /\bfeel\s+(good|great|better|safe)\b/i
];

// Business metrics that indicate real, measurable value
const BUSINESS_METRICS = [
  'revenue', 'cost', 'time', 'efficiency', 'productivity', 'conversion',
  'retention', 'churn', 'engagement', 'throughput', 'speed', 'accuracy',
  'error', 'defect', 'downtime', 'uptime', 'response time', 'latency',
  'sales', 'profit', 'margin', 'roi', 'compliance', 'risk', 'quality',
  'customer satisfaction', 'nps', 'utilization', 'utilisation', 'capacity', 'backlog',
  'ticket', 'resolution time', 'processing time', 'load time', 'wait time',
  'abandonment', 'cart abandonment', 'bounce rate', 'click-through', 'ctr'
];

/**
 * Score a user story based on multiple criteria
 * @param {Object} story - The user story with asA, iWant, soThat fields
 * @returns {Object} Score breakdown and feedback
 */
export function scoreStory(story) {
  const { asA, iWant, soThat } = story;
  
  let totalScore = 0;
  const breakdown = {};
  
  // 1. Completeness check (+10 points)
  const isComplete = asA.trim() && iWant.trim() && soThat.trim();
  breakdown.completeness = isComplete ? 10 : 0;
  totalScore += breakdown.completeness;
  
  if (!isComplete) {
    return { totalScore, breakdown, feedback: ["Complete all three fields to earn full points."], suggestions: [] };
  }
  
  // 2. Length check (0-10 points, ideal: 18-40 words)
  const fullStory = `${asA} ${iWant} ${soThat}`;
  const wordCount = fullStory.trim().split(/\s+/).length;
  breakdown.length = scoreLengthBand(wordCount);
  totalScore += breakdown.length;
  
  // 3. Clarity check (0-10 points)
  breakdown.clarity = scoreClarity(fullStory);
  totalScore += breakdown.clarity;
  
  // 4. "So that" quality (0-20 points)
  breakdown.soThatQuality = scoreSoThatQuality(soThat);
  totalScore += breakdown.soThatQuality;
  
  // 5. Creativity bonus (0-5 points)
  breakdown.creativity = scoreCreativity(fullStory);
  totalScore += breakdown.creativity;
  
  const feedback = buildStoryFeedback(breakdown, wordCount, fullStory);
  const suggestions = generateSuggestions(story, breakdown);
  
  return {
    totalScore,
    breakdown,
    feedback,
    suggestions,
    wordCount
  };
}

function buildStoryFeedback(breakdown, wordCount, fullStory) {
  const feedback = [];
  if (wordCount < 10) {
    feedback.push("Your story is quite short. Add more detail.");
  } else if (wordCount > 50) {
    feedback.push("Your story is a bit long. Try to be more concise.");
  } else if (wordCount >= 18 && wordCount <= 40) {
    feedback.push("Great length! Clear and concise.");
  }
  
  const fillerCount = countFillerWords(fullStory);
  if (fillerCount > 0) {
    feedback.push(`Remove filler words like "${findFillerWords(fullStory).join('", "')}" for better clarity.`);
  } else if (breakdown.clarity >= 8) {
    feedback.push("Excellent clarity! Your language is direct and simple.");
  }
  
  if (breakdown.soThatQuality >= 15) {
    feedback.push("Your value statement is strong and specific!");
  } else if (breakdown.soThatQuality < 10) {
    feedback.push("Try to make your 'So that' more specific about the value or outcome.");
  }
  
  return feedback;
}

function scoreLengthBand(wordCount) {
  // Note: order matters — the first matching band wins (early-exit),
  // so bands are arranged in ascending range order.
  const bands = [
    { matches: (count) => count < 5, score: 0 },
    { matches: (count) => count < 10, score: 3 },
    { matches: (count) => count < 15, score: 6 },
    { matches: (count) => count < 18, score: 8 },
    { matches: (count) => count <= 40, score: 10 },
    { matches: (count) => count <= 50, score: 7 },
    { matches: (count) => count > 50, score: 4 },
  ];

  for (const band of bands) {
    if (band.matches(wordCount)) {
      return band.score;
    }
  }
}

function scoreClarity(text) {
  const lowerText = text.toLowerCase();
  const fillerCount = countFillerWords(lowerText);
  const hasVaguePhrases = VAGUE_PHRASES.some(phrase => lowerText.includes(phrase));
  
  let score = 10;
  score -= fillerCount * 2; // -2 per filler word
  if (hasVaguePhrases) score -= 3;
  
  return Math.max(0, score);
}

/**
 * Simplified "So that" quality scorer used internally by scoreStory.
 * Why: Intentionally simpler than scoreSoThatStatement — it contributes one component
 * of a multi-field story score rather than providing standalone real-time feedback.
 */
function scoreSoThatQuality(soThat) {
  const lowerText = soThat.toLowerCase();
  
  let score = 5; // Base score
  
  // Check for value-oriented phrases
  const valuePhrasesFound = VALUE_PHRASES.filter(phrase => 
    lowerText.includes(phrase)
  );
  score += valuePhrasesFound.length * 3; // +3 per value phrase
  
  // Check for vague phrases
  const hasVaguePhrases = VAGUE_PHRASES.some(phrase => lowerText.includes(phrase));
  if (hasVaguePhrases) score -= 5;
  
  // Reward specific outcomes (longer, more detailed)
  const wordCount = soThat.trim().split(/\s+/).length;
  if (wordCount >= 8) score += 3;
  if (wordCount >= 12) score += 2;
  
  // Penalize very short "so that" statements
  if (wordCount < 4) score -= 3;
  
  return Math.min(20, Math.max(0, score));
}

function scoreCreativity(text) {
  // Word diversity check - measures unique words vs repetition
  // Higher ratio = less repetition = bonus points
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;
  
  if (uniqueRatio > 0.85) return 5; // 85%+ unique words
  if (uniqueRatio > 0.75) return 3; // 75%+ unique words
  if (uniqueRatio > 0.65) return 2; // 65%+ unique words
  return 0;
}

function countFillerWords(text) {
  const lowerText = text.toLowerCase();
  return FILLER_WORDS.filter(fillerWord => 
    lowerText.includes(fillerWord)
  ).length;
}

function findFillerWords(text) {
  const lowerText = text.toLowerCase();
  return FILLER_WORDS.filter(fillerWord => lowerText.includes(fillerWord));
}

function generateSuggestions(story, breakdown) {
  const suggestions = [];
  const soThatText = story.soThat?.toLowerCase() || '';
  const hasValuePhrase = VALUE_PHRASES.some((phrase) => soThatText.includes(phrase));
  
  if (breakdown.soThatQuality < 15) {
    if (!hasValuePhrase) {
      suggestions.push("Try starting your 'So that' with an action verb like 'increase', 'reduce', or 'enable'");
    } else {
      suggestions.push("Your 'So that' includes value words (e.g., increase, reduce, enable, improve, save)—make the outcome even more specific and measurable.");
    }
  }
  
  if (breakdown.clarity < 8) {
    suggestions.push("Use simpler, more direct language");
  }
  
  if (breakdown.length < 6) {
    suggestions.push("Add more context to make your story clearer");
  }
  
  return suggestions;
}

/**
 * Score a single "So that" statement for real-time feedback.
 * Used for real-time single-field feedback with richer analysis including business metrics
 * and flowery language detection. This is a separate export from scoreSoThatQuality, which
 * is used internally by scoreStory for whole-story scoring and is intentionally simpler.
 * @param {string} soThat - The "So that" text
 * @returns {Object|null} Score details with grade and feedback, or null for empty input
 */
export function scoreSoThatStatement(soThat) {
  const trimmed = soThat.trim();
  if (!trimmed) {
    return null;
  }

  const lowerText = trimmed.toLowerCase();
  const words = lowerText.split(/\s+/);
  const wordCount = words.length;
  let score = 0;
  const maxScore = 20;
  const issues = [];
  const strengths = [];
  const suggestions = []; // For improvement tips
  const indicators = analyzeSoThatIndicators(trimmed, lowerText);

  score = applyLanguagePenalties(score, issues, indicators);
  score = applyValuePhraseScore(score, issues, strengths, suggestions, indicators);
  score = applyBusinessMetricScore(score, issues, strengths, suggestions, indicators);
  score = applyLengthScore(score, wordCount, issues, suggestions, indicators.hasFloweryLanguage);

  // Ensure score is within bounds
  score = Math.min(maxScore, Math.max(0, score));

  const { grade, color } = determineSoThatGrade(score);
  const feedback = buildSoThatFeedback(score, wordCount, issues, strengths, indicators);

  return {
    score,
    maxScore,
    grade,
    color,
    feedback
  };
}

function analyzeSoThatIndicators(trimmed, lowerText) {
  // Why: whole-word regex prevents false positives such as 'live' matching 'deliver'
  // or 'home' matching 'homepage'. Terms are regex-escaped for safety.
  const escapeRegex = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const matchesWholeWord = (term) =>
    new RegExp('\\b' + escapeRegex(term) + '\\b').test(lowerText);

  const nonBusinessFound = NON_BUSINESS_TERMS.filter(matchesWholeWord);
  const floweryPatternMatches = FLOWERY_PATTERNS.filter(pattern => pattern.test(trimmed));
  const valuePhrasesFound = VALUE_PHRASES.filter(phrase => lowerText.includes(phrase));
  const businessMetricsFound = BUSINESS_METRICS.filter(matchesWholeWord);

  return {
    nonBusinessFound,
    floweryPatternMatches,
    hasFloweryLanguage: nonBusinessFound.length > 0 || floweryPatternMatches.length > 0,
    hasVaguePhrases: VAGUE_PHRASES.some(phrase => lowerText.includes(phrase)),
    valuePhrasesFound,
    hasBusinessMetrics: businessMetricsFound.length > 0,
    hasNumbers: /\d+/.test(trimmed),
  };
}

function applyLanguagePenalties(score, issues, indicators) {
  if (indicators.hasFloweryLanguage) {
    score = Math.max(0, score - 8);
    if (indicators.nonBusinessFound.length > 0) {
      issues.push(`Avoid non-business terms like "${indicators.nonBusinessFound.slice(0, 2).join('", "')}"`);
    }
    if (indicators.floweryPatternMatches.length > 0) {
      issues.push('Remove emotional/flowery phrases - focus on concrete business outcomes');
    }
  }

  if (indicators.hasVaguePhrases) {
    score = Math.max(0, score - 5);
    issues.push('Replace vague phrases with specific, measurable outcomes');
  }

  return score;
}

function applyValuePhraseScore(score, issues, strengths, suggestions, indicators) {
  if (indicators.valuePhrasesFound.length === 0) {
    issues.push('Start with an action verb like "reduce", "increase", or "enable"');
    suggestions.push('Add a value verb at the start');
    return score;
  }

  score += Math.min(9, indicators.valuePhrasesFound.length * 3);
  if (!indicators.hasFloweryLanguage && !indicators.hasVaguePhrases) {
    strengths.push('Good use of action verbs');
  }

  return score;
}

function applyBusinessMetricScore(score, issues, strengths, suggestions, indicators) {
  if (indicators.hasBusinessMetrics && indicators.hasNumbers) {
    score += 8;
    if (!indicators.hasFloweryLanguage) {
      strengths.push('Tied to real business metrics');
    }
    return score;
  }

  if (indicators.hasBusinessMetrics) {
    score += 4;
    if (!indicators.hasFloweryLanguage) {
      suggestions.push('Add specific numbers or percentages');
    }
    return score;
  }

  if (indicators.hasNumbers && !indicators.hasFloweryLanguage) {
    score += 2;
    issues.push('Link numbers to business metrics (time saved, cost reduced, conversion rate, etc.)');
    suggestions.push('Connect the percentage to a specific metric like "response time" or "conversion rate"');
    return score;
  }

  if (!indicators.hasNumbers && !indicators.hasBusinessMetrics) {
    issues.push('Add measurable outcomes (e.g., "reduce processing time by 50%")');
    suggestions.push('Add a specific metric with numbers');
  }

  return score;
}

function applyLengthScore(score, wordCount, issues, suggestions, hasFloweryLanguage) {
  if (wordCount >= 10 && !hasFloweryLanguage) {
    return score + 5;
  }

  if (wordCount >= 7) {
    return score + 3;
  }

  if (wordCount >= 4) {
    if (issues.length === 0) {
      issues.push('Add more detail about the business value or outcome');
    }
    return score + 1;
  }

  issues.push('Too brief - describe the specific value or benefit');
  suggestions.push('Expand with more detail about the business impact');
  return score;
}

function determineSoThatGrade(score) {
  if (score >= 17) return { grade: 'Excellent', color: 'green' };
  if (score >= 13) return { grade: 'Good', color: 'blue' };
  if (score >= 9) return { grade: 'Fair', color: 'yellow' };
  return { grade: 'Needs work', color: 'orange' };
}

function buildSoThatFeedback(score, wordCount, issues, strengths, indicators) {
  if (indicators.hasFloweryLanguage) {
    return 'Remove emotional language. Focus on measurable business outcomes like "reduce support tickets by 30%".';
  }

  if (score >= 17) {
    return strengths.length > 0 ? `${strengths.join(', ')}!` : 'Excellent business value statement!';
  }

  if (score >= 13) {
    const missing = getExcellentGapMessages(wordCount, indicators);
    return missing.length > 0
      ? `To reach Excellent: ${missing.join(', ')}.`
      : 'Good! Add more specific business context to reach Excellent.';
  }

  if (issues.length > 0) {
    return `${issues[0]}.`;
  }

  return 'Add specific, measurable business outcomes.';
}

function getExcellentGapMessages(wordCount, indicators) {
  const missing = [];

  if (!indicators.hasBusinessMetrics) {
    missing.push('tie to a business metric (response time, conversion rate, cost, revenue)');
  }
  if (!indicators.hasNumbers) {
    missing.push('add specific numbers or percentages');
  }
  if (indicators.hasNumbers && !indicators.hasBusinessMetrics) {
    missing.push('specify what the percentage improves (e.g., "conversion rate" not just generic improvement)');
  }
  if (wordCount < 10) {
    missing.push('add more specific detail');
  }

  return missing;
}

/**
 * Calculate XP and level from total score
 */
export function calculateProgression(totalXP) {
  const levels = [
    { name: 'Novice', threshold: 0 },
    { name: 'Apprentice', threshold: 500 },
    { name: 'Writer', threshold: 1500 },
    { name: 'Storyteller', threshold: 3500 },
    { name: 'Narrative Ninja', threshold: 7000 },
    { name: 'Backlog Architect', threshold: 12000 },
    { name: 'Value Strategist', threshold: 20000 },
    { name: 'Product Visionary', threshold: 30000 },
    { name: 'Roadmap Oracle', threshold: 40000 },
    { name: 'Product Sage', threshold: 50000 }
  ];
  
  let currentLevel = levels[0];
  let nextLevel = levels[1];
  
  for (let i = 0; i < levels.length; i++) {
    if (totalXP >= levels[i].threshold) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
    }
  }
  
  return { currentLevel, nextLevel };
}

/**
 * All possible story achievements (used for badge display)
 */
export const STORY_BADGES = [
  {
    id: 'crystal-clear',
    emoji: '💎',
    name: 'Crystal Clear Value',
    description: 'Score 50+ points on a story'
  },
  {
    id: 'epic-writer',
    emoji: '✍️',
    name: 'Epic Writer',
    description: 'Score 55+ points on a story'
  },
  {
    id: 'concise-master',
    emoji: '✂️',
    name: 'Concise Master',
    description: 'Write a high-quality story in 20 words or less'
  },
  {
    id: 'on-fire',
    emoji: '🔥',
    name: 'On Fire!',
    description: 'Get 40+ points on three consecutive stories'
  }
];

/**
 * Check if an achievement is earned for the current story.
 * @param {number} score - The score for the current story
 * @param {number} wordCount - Word count of the current story
 * @param {Array<{score: number}>} storyHistory - Prior stories (must NOT include the current story;
 *   it is merged internally to evaluate streaks)
 * @returns {Array<Object>} List of earned achievements
 */
export function checkAchievements(score, wordCount, storyHistory = []) {
  const achievements = [];
  
  if (score >= 50) {
    achievements.push({
      id: 'crystal-clear',
      name: 'Crystal Clear Value',
      description: 'Scored 50+ points on a story'
    });
  }
  
  if (score >= 55) {
    achievements.push({
      id: 'epic-writer',
      name: 'Epic Writer',
      description: 'Scored 55+ points on a story'
    });
  }
  
  if (wordCount <= 20 && score >= 40) {
    achievements.push({
      id: 'concise-master',
      name: 'Concise Master',
      description: 'Wrote a high-quality story in 20 words or less'
    });
  }
  
  if (storyHistory.length >= 2) {
    const recentScores = [...storyHistory, { score }].slice(-3).map(s => s.score);
    if (recentScores.every(s => s >= 40)) {
      achievements.push({
        id: 'on-fire',
        name: 'On Fire!',
        description: 'Three consecutive stories with 40+ points'
      });
    }
  }
  
  return achievements;
}
