/**
 * NLP Scoring Engine for Agile User Stories
 * Uses lightweight heuristics to score story quality
 */

// Value-oriented phrases that indicate good outcomes
const VALUE_PHRASES = [
  'increase', 'reduce', 'enable', 'improve', 'access', 'understand',
  'save', 'automate', 'simplify', 'enhance', 'provide', 'allow',
  'track', 'manage', 'control', 'optimize', 'streamline', 'eliminate',
  'achieve', 'ensure', 'maintain', 'deliver', 'create', 'view'
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
  // Simple creativity check - reward unique word usage
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;
  
  if (uniqueRatio > 0.85) return 5;
  if (uniqueRatio > 0.75) return 3;
  if (uniqueRatio > 0.65) return 2;
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
  
  if (breakdown.soThatQuality < 15) {
    suggestions.push("Try starting your 'So that' with an action verb like 'increase', 'reduce', or 'enable'");
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
  
  if (storyHistory.length >= 3) {
    const recentScores = storyHistory.slice(-3).map(s => s.score);
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
