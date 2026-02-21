/**
 * NLP Scoring Engine for Agile User Stories
 * Uses lightweight heuristics to score story quality
 */

// Value-oriented phrases that indicate good outcomes
const VALUE_PHRASES = [
  'increase', 'reduce', 'enable', 'improve', 'access', 'understand',
  'save', 'automate', 'simplify', 'enhance', 'provide', 'allow',
  'track', 'manage', 'control', 'optimize', 'streamline', 'eliminate',
  'achieve', 'ensure', 'maintain', 'deliver', 'create', 'view',
  'generate', 'decrease', 'minimize', 'maximize', 'accelerate'
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
  'customer satisfaction', 'nps', 'utilization', 'capacity', 'backlog',
  'ticket', 'resolution time', 'processing time', 'load time', 'wait time',
  'abandonment', 'cart abandonment', 'bounce rate', 'click-through', 'ctr'
];

export const STORY_ACHIEVEMENT_CATALOG = [
  {
    id: 'crystal-clear',
    name: 'Crystal Clear Value',
    description: 'Scored 50+ points on a story',
    requirement: 'Score at least 50 points on a single user story'
  },
  {
    id: 'epic-writer',
    name: 'Epic Writer',
    description: 'Scored 55+ points on a story',
    requirement: 'Score at least 55 points on a single user story'
  },
  {
    id: 'concise-master',
    name: 'Concise Master',
    description: 'Wrote a high-quality story in 20 words or less',
    requirement: 'Write a story of 20 words or fewer and score at least 40 points'
  },
  {
    id: 'on-fire',
    name: 'On Fire!',
    description: 'Three consecutive stories with 40+ points',
    requirement: 'Score 40+ points in three consecutive stories'
  }
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
  const feedback = [];
  
  // 1. Completeness check (+10 points)
  const isComplete = asA.trim() && iWant.trim() && soThat.trim();
  breakdown.completeness = isComplete ? 10 : 0;
  totalScore += breakdown.completeness;
  
  if (!isComplete) {
    feedback.push("Complete all three fields to earn full points.");
    return { totalScore, breakdown, feedback, suggestions: [] };
  }
  
  // 2. Length check (0-10 points, ideal: 18-40 words)
  const fullStory = `${asA} ${iWant} ${soThat}`;
  const wordCount = fullStory.trim().split(/\s+/).length;
  breakdown.length = scoreLengthBand(wordCount);
  totalScore += breakdown.length;
  
  if (wordCount < 10) {
    feedback.push("Your story is quite short. Add more detail.");
  } else if (wordCount > 50) {
    feedback.push("Your story is a bit long. Try to be more concise.");
  } else if (wordCount >= 18 && wordCount <= 40) {
    feedback.push("Great length! Clear and concise.");
  }
  
  // 3. Clarity check (0-10 points)
  breakdown.clarity = scoreClarity(fullStory);
  totalScore += breakdown.clarity;
  
  const fillerCount = countFillerWords(fullStory);
  if (fillerCount > 0) {
    feedback.push(`Remove filler words like "${findFillerWords(fullStory).join('", "')}" for better clarity.`);
  } else if (breakdown.clarity >= 8) {
    feedback.push("Excellent clarity! Your language is direct and simple.");
  }
  
  // 4. "So that" quality (0-20 points)
  breakdown.soThatQuality = scoreSoThatQuality(soThat);
  totalScore += breakdown.soThatQuality;
  
  if (breakdown.soThatQuality >= 15) {
    feedback.push("Your value statement is strong and specific!");
  } else if (breakdown.soThatQuality < 10) {
    feedback.push("Try to make your 'So that' more specific about the value or outcome.");
  }
  
  // 5. Creativity bonus (0-5 points)
  breakdown.creativity = scoreCreativity(fullStory);
  totalScore += breakdown.creativity;
  
  // Generate suggestions
  const suggestions = generateSuggestions(story, breakdown);
  
  return {
    totalScore,
    breakdown,
    feedback,
    suggestions,
    wordCount
  };
}

function scoreLengthBand(wordCount) {
  if (wordCount < 5) return 0;
  if (wordCount < 10) return 3;
  if (wordCount < 15) return 6;
  if (wordCount >= 18 && wordCount <= 40) return 10;
  if (wordCount >= 15 && wordCount < 18) return 8;
  if (wordCount > 40 && wordCount <= 50) return 7;
  if (wordCount > 50) return 4;
  return 5;
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
  const words = lowerText.split(/\s+/);
  return FILLER_WORDS.filter(fillerWord => 
    words.includes(fillerWord)
  ).length;
}

function findFillerWords(text) {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  return FILLER_WORDS.filter(fillerWord => words.includes(fillerWord));
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
 * Score a single "So that" statement for real-time feedback
 * @param {string} soThat - The "So that" text
 * @returns {Object} Score details with grade and feedback
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

  // Check for non-business/flowery language first (critical issue)
  const nonBusinessFound = NON_BUSINESS_TERMS.filter(term => 
    lowerText.includes(term) || words.includes(term)
  );
  const floweryPatternMatches = FLOWERY_PATTERNS.filter(pattern => pattern.test(trimmed));
  const hasFloweryLanguage = nonBusinessFound.length > 0 || floweryPatternMatches.length > 0;

  // Check for vague phrases
  const hasVaguePhrases = VAGUE_PHRASES.some(phrase => lowerText.includes(phrase));

  // Check for value-oriented action words
  const valuePhrasesFound = VALUE_PHRASES.filter(phrase => lowerText.includes(phrase));

  // Check for business metrics
  const businessMetricsFound = BUSINESS_METRICS.filter(metric => lowerText.includes(metric));
  const hasBusinessMetrics = businessMetricsFound.length > 0;

  // Check for numbers (could be meaningful or not)
  const hasNumbers = /\d+/.test(trimmed);

  // 1. Critical penalties for non-business language (-8 points)
  if (hasFloweryLanguage) {
    score = Math.max(0, score - 8);
    if (nonBusinessFound.length > 0) {
      issues.push(`Avoid non-business terms like "${nonBusinessFound.slice(0, 2).join('", "')}"`);
    }
    if (floweryPatternMatches.length > 0) {
      issues.push('Remove emotional/flowery phrases - focus on concrete business outcomes');
    }
  }

  // 2. Vague phrases penalty (-5 points)
  if (hasVaguePhrases) {
    score = Math.max(0, score - 5);
    issues.push('Replace vague phrases with specific, measurable outcomes');
  }

  // 3. Value phrases (0-9 points)
  let valueScore = 0;
  if (valuePhrasesFound.length > 0) {
    valueScore = Math.min(9, valuePhrasesFound.length * 3);
    score += valueScore;
    if (!hasFloweryLanguage && !hasVaguePhrases) {
      strengths.push('Good use of action verbs');
    }
  } else {
    issues.push('Start with an action verb like "reduce", "increase", or "enable"');
    suggestions.push('Add a value verb at the start');
  }

  // 4. Business metrics and numbers (0-11 points)
  // For Excellent: need BOTH metrics AND numbers
  if (hasBusinessMetrics && hasNumbers) {
    score += 8; // Both metrics and numbers = excellent
    if (!hasFloweryLanguage) {
      strengths.push('Tied to real business metrics');
    }
  } else if (hasBusinessMetrics) {
    score += 4; // Has metrics but no numbers
    if (!hasFloweryLanguage) {
      suggestions.push('Add specific numbers or percentages');
    }
  } else if (hasNumbers && !hasFloweryLanguage) {
    // Has numbers but no business context
    score += 2;
    issues.push('Link numbers to business metrics (time saved, cost reduced, conversion rate, etc.)');
    suggestions.push('Connect the percentage to a specific metric like "response time" or "conversion rate"');
  } else if (!hasNumbers && !hasBusinessMetrics) {
    issues.push('Add measurable outcomes (e.g., "reduce processing time by 50%")');
    suggestions.push('Add a specific metric with numbers');
  }

  // 5. Length and detail (0-5 points)
  if (wordCount >= 10 && !hasFloweryLanguage) {
    score += 5;
  } else if (wordCount >= 7) {
    score += 3;
  } else if (wordCount >= 4) {
    score += 1;
    if (issues.length === 0) {
      issues.push('Add more detail about the business value or outcome');
    }
  } else {
    issues.push('Too brief - describe the specific value or benefit');
    suggestions.push('Expand with more detail about the business impact');
  }

  // Ensure score is within bounds
  score = Math.min(maxScore, Math.max(0, score));

  // Determine grade and color
  let grade, color;
  if (score >= 17) {
    grade = 'Excellent';
    color = 'green';
  } else if (score >= 13) {
    grade = 'Good';
    color = 'blue';
  } else if (score >= 9) {
    grade = 'Fair';
    color = 'yellow';
  } else {
    grade = 'Needs work';
    color = 'orange';
  }

  // Build feedback message with specific improvement guidance
  let feedback;
  
  if (hasFloweryLanguage) {
    // Critical issue - focus on this first
    feedback = 'Remove emotional language. Focus on measurable business outcomes like "reduce support tickets by 30%".';
  } else if (score >= 17) {
    // Excellent - celebrate success
    feedback = strengths.length > 0 ? strengths.join(', ') + '!' : 'Excellent business value statement!';
  } else if (score >= 13 && score < 17) {
    // Good but not excellent - tell them what's missing to get to 17+
    const missing = [];
    if (!hasBusinessMetrics) {
      missing.push('tie to a business metric (response time, conversion rate, cost, revenue)');
    }
    if (!hasNumbers) {
      missing.push('add specific numbers or percentages');
    }
    if (hasNumbers && !hasBusinessMetrics) {
      missing.push('specify what the percentage improves (e.g., "conversion rate" not just generic improvement)');
    }
    if (wordCount < 10) {
      missing.push('add more specific detail');
    }
    
    if (missing.length > 0) {
      feedback = `To reach Excellent: ${missing.join(', ')}.`;
    } else {
      feedback = 'Good! Add more specific business context to reach Excellent.';
    }
  } else if (issues.length > 0) {
    // Fair or Needs work - show main issue
    feedback = issues[0] + '.';
  } else {
    feedback = 'Add specific, measurable business outcomes.';
  }

  return {
    score,
    maxScore,
    grade,
    color,
    feedback
  };
}

/**
 * Calculate XP and level from total score
 */
export function calculateProgression(totalXP) {
  const levels = [
    { name: 'Novice', threshold: 0 },
    { name: 'Apprentice', threshold: 100 },
    { name: 'Writer', threshold: 300 },
    { name: 'Storyteller', threshold: 600 },
    { name: 'Product Sage', threshold: 1000 }
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
 * Check if an achievement is earned
 */
export function checkAchievements(score, wordCount, storyHistory = []) {
  const achievements = [];
  const getAchievement = (id) => STORY_ACHIEVEMENT_CATALOG.find((achievement) => achievement.id === id);
  
  if (score >= 50) {
    achievements.push(getAchievement('crystal-clear'));
  }
  
  if (score >= 55) {
    achievements.push(getAchievement('epic-writer'));
  }
  
  if (wordCount <= 20 && score >= 40) {
    achievements.push(getAchievement('concise-master'));
  }
  
  if (storyHistory.length >= 3) {
    const recentScores = storyHistory.slice(-3).map(s => s.score);
    if (recentScores.every(s => s >= 40)) {
      achievements.push(getAchievement('on-fire'));
    }
  }
  
  return achievements;
}
