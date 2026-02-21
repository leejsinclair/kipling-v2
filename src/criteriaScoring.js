/**
 * Acceptance Criteria Scoring Engine
 * Evaluates acceptance criteria for format, testability, specificity, and alignment
 */

// Gherkin keywords
const GHERKIN_KEYWORDS = {
  given: ['given', 'given that'],
  when: ['when', 'when the', 'when a', 'when an'],
  then: ['then', 'then the', 'then a', 'then an'],
  and: ['and', 'and the', 'and a', 'and an']
};

// Observable outcome patterns (testable, visible results)
const OBSERVABLE_PATTERNS = [
  'system displays', 'user can', 'user is able to', 'system shows',
  'displays', 'shows', 'shown', 'appears', 'is visible', 'is displayed',
  'user sees', 'button', 'field', '  message', // double space before message to avoid matching everything
  'notification', 'alert', 'confirmation', 'error message', 'success message',
  'error ', 'errors ', // with space to be more specific
  'icon', 'modal', 'dialog', 'redirects', 'redirect', 'updates', 'update',
  'returns', 'responds with', 'response', 'status code',
  'page', 'downloads', 'download' // removed 'click' as it's an action, not an outcome
];

// Vague/weak terms to avoid
const VAGUE_TERMS = [
  'should basically', 'kind of', 'sort of', 'mostly', 'probably',
  'might', 'maybe', 'could possibly', 'somewhat', 'generally'
];

// Value-oriented action verbs
const VALUE_VERBS = [
  'increase', 'reduce', 'enable', 'improve', 'access', 'save',
  'automate', 'simplify', 'enhance', 'provide', 'allow', 'ensure',
  'maintain', 'prevent', 'support', 'facilitate'
];

export const CRITERIA_ACHIEVEMENT_CATALOG = [
  {
    id: 'testability-master',
    name: 'Testability Master',
    description: 'Scored 50+ points on acceptance criteria',
    requirement: 'Score at least 50 points on acceptance criteria'
  },
  {
    id: 'gherkin-guru',
    name: 'Gherkin Guru',
    description: 'Perfect format score on acceptance criteria',
    requirement: 'Achieve a format score of at least 9 in acceptance criteria'
  },
  {
    id: 'observable-outcomes',
    name: 'Observable Outcomes',
    description: 'Excellent testability score (14+)',
    requirement: 'Achieve a testability score of at least 14'
  },
  {
    id: 'comprehensive-coverage',
    name: 'Comprehensive Coverage',
    description: 'Wrote 5+ high-quality acceptance criteria',
    requirement: 'Write at least 5 criteria and score at least 45 points'
  }
];

/**
 * Score acceptance criteria
 * @param {Array<string>} criteria - Array of acceptance criteria strings
 * @param {string} storyValue - The "So that..." value statement from the story
 * @param {string} selectedFormat - The format chosen by the user ('gherkin' or 'bullet')
 * @returns {Object} Score breakdown and feedback
 */
export function scoreCriteria(criteria, storyValue = '', selectedFormat = 'gherkin') {
  if (!criteria || criteria.length === 0) {
    return {
      totalScore: 0,
      breakdown: {},
      feedback: ['Please add at least one acceptance criterion'],
      suggestions: []
    };
  }

  let totalScore = 0;
  const breakdown = {};
  const feedback = [];
  const suggestions = [];

  // Score each category
  breakdown.format = scoreFormat(criteria, selectedFormat);
  breakdown.testability = scoreTestability(criteria);
  breakdown.specificity = scoreSpecificity(criteria);
  breakdown.alignment = scoreAlignment(criteria, storyValue);
  breakdown.completeness = scoreCompleteness(criteria, selectedFormat);

  // Calculate total (max 55 points for criteria, matching story max)
  totalScore = breakdown.format + breakdown.testability + breakdown.specificity + 
               breakdown.alignment + breakdown.completeness;

  // Generate feedback
  if (breakdown.format >= 8) {
    feedback.push('Excellent format! Your criteria follow a clear structure.');
  } else if (breakdown.format < 5) {
    if (selectedFormat === 'bullet') {
      feedback.push('Consider starting each criterion with "The system must..." or "The user can..." for clearer criteria.');
    } else {
      feedback.push('Consider using Gherkin format (Given/When/Then) for clearer criteria.');
    }
  }

  if (breakdown.testability >= 12) {
    feedback.push('Great testability! Your criteria have clear, observable outcomes.');
  } else if (breakdown.testability < 8) {
    feedback.push('Make your criteria more testable with specific, observable outcomes.');
  }

  if (breakdown.specificity >= 8) {
    feedback.push('Nice specificity! Your criteria are clear and unambiguous.');
  } else {
    feedback.push('Avoid vague language. Be more specific about expected behaviors.');
  }

  if (breakdown.alignment >= 8) {
    feedback.push('Your criteria align well with the story\'s value proposition.');
  } else if (storyValue) {
    feedback.push('Try to align your criteria more closely with the story\'s "So that..." value.');
  }

  if (breakdown.completeness >= 8) {
    feedback.push('Comprehensive criteria covering the full scenario.');
  }

  // Generate suggestions
  if (breakdown.format < 8) {
    if (selectedFormat === 'bullet') {
      suggestions.push('Try starting each criterion with "The system must...", "The user can...", or "The page displays..."');
    } else {
      suggestions.push('Try using "Given [context], When [action], Then [outcome]" format');
    }
  }

  if (breakdown.testability < 10) {
    suggestions.push('Include observable outcomes like "system displays..." or "user can..."');
  }

  if (breakdown.specificity < 8) {
    suggestions.push('Replace vague terms with specific, measurable criteria');
  }

  if (criteria.length < 3) {
    suggestions.push('Consider adding more criteria to cover edge cases and variations');
  }

  return {
    totalScore: Math.min(55, totalScore), // Cap at 55 to match story scoring
    breakdown,
    feedback,
    suggestions,
    criteriaCount: criteria.length
  };
}

/**
 * Score format (Gherkin or bullet-point structure)
 * Max: 10 points
 * @param {Array<string>} criteria
 * @param {string} selectedFormat - 'gherkin' or 'bullet'
 */
function scoreFormat(criteria, selectedFormat = 'gherkin') {
  let score = 0;
  let gherkinCount = 0;
  let structuredCount = 0;

  criteria.forEach(criterion => {
    const lower = criterion.toLowerCase().trim();
    
    // Check for Gherkin format
    const hasGiven = GHERKIN_KEYWORDS.given.some(kw => lower.startsWith(kw));
    const hasWhen = GHERKIN_KEYWORDS.when.some(kw => lower.includes(kw));
    const hasThen = GHERKIN_KEYWORDS.then.some(kw => lower.includes(kw));
    
    if (hasGiven || hasWhen || hasThen) {
      gherkinCount++;
    }
    
    // Check for bullet-point behavioral structure
    if (lower.startsWith('the system') || lower.startsWith('the user') ||
        lower.startsWith('user can') || lower.startsWith('system must')) {
      structuredCount++;
    }
  });

  const criteriaLength = criteria.length;

  if (selectedFormat === 'bullet') {
    // Score based on bullet-point structure when bullet format is selected
    if (structuredCount >= criteriaLength * 0.6) {
      score = 10; // Consistent bullet-point format
    } else if (structuredCount >= criteriaLength * 0.3) {
      score = 7; // Partial bullet-point structure
    } else if (gherkinCount >= criteriaLength * 0.3) {
      score = 5; // Using Gherkin when bullet was selected
    } else {
      score = 3; // Minimal structure
    }
  } else {
    // Score based on Gherkin structure when gherkin format is selected (default)
    if (gherkinCount >= criteriaLength * 0.6) {
      score = 10; // Consistent Gherkin format
    } else if (gherkinCount >= criteriaLength * 0.3) {
      score = 7; // Partial Gherkin format
    } else if (structuredCount >= criteriaLength * 0.6) {
      score = 5; // Using bullet when Gherkin was selected
    } else if (structuredCount >= criteriaLength * 0.3) {
      score = 4; // Partial bullet structure
    } else {
      score = 3; // Minimal structure
    }
  }

  return score;
}

/**
 * Score testability (observable outcomes)
 * Max: 15 points
 */
function scoreTestability(criteria) {
  let score = 0;

  criteria.forEach(criterion => {
    const lower = criterion.toLowerCase();
    
    // Check for observable patterns
    const hasObservable = OBSERVABLE_PATTERNS.some(pattern => 
      lower.includes(pattern)
    );
    
    if (hasObservable) {
      score += 3; // +3 per testable criterion
    } else {
      score += 1; // +1 for having a criterion, even if not clearly testable
    }
  });

  return Math.min(15, score);
}

/**
 * Score specificity (avoiding vague language)
 * Max: 10 points
 */
function scoreSpecificity(criteria) {
  let score = 10; // Start with full score

  criteria.forEach(criterion => {
    const lower = criterion.toLowerCase();
    
    // Check for vague terms
    const hasVague = VAGUE_TERMS.some(term => lower.includes(term));
    if (hasVague) {
      score -= 2; // -2 per vague term
    }
    
    // Penalize overly short criteria
    if (criterion.trim().split(/\s+/).length < 3) {
      score -= 1;
    }
    
    // Penalize overly long criteria
    if (criterion.trim().split(/\s+/).length > 50) {
      score -= 1;
    }
  });

  return Math.max(0, score);
}

/**
 * Score alignment with story's value statement
 * Max: 10 points
 */
function scoreAlignment(criteria, storyValue) {
  if (!storyValue) {
    return 5; // Default score if no story value provided
  }

  let score = 5; // Base score
  const valueLower = storyValue.toLowerCase();
  
  // Extract key value verbs from story
  const valueVerbs = VALUE_VERBS.filter(verb => valueLower.includes(verb));
  
  // Check if criteria reference the value proposition
  criteria.forEach(criterion => {
    const criterionLower = criterion.toLowerCase();
    
    // Check if criterion mentions value verbs from story
    const hasValueVerb = valueVerbs.some(verb => criterionLower.includes(verb));
    if (hasValueVerb) {
      score += 1;
    }
  });

  return Math.min(10, score);
}

/**
 * Score completeness (Given/When/Then or equivalent coverage)
 * Max: 10 points
 */
function scoreCompleteness(criteria, selectedFormat = 'gherkin') {
  let score = 0;

  if (selectedFormat === 'bullet') {
    // For bullet format: check for behavioral coverage (must/can/displays patterns)
    let hasMust = false;
    let hasCan = false;
    let hasDisplays = false;

    criteria.forEach(criterion => {
      const lower = criterion.toLowerCase();
      if (lower.includes('must') || lower.includes('shall')) hasMust = true;
      if (lower.includes('can') || lower.includes('able to')) hasCan = true;
      if (lower.includes('display') || lower.includes('show') || lower.includes('appear') ||
          lower.includes('message') || lower.includes('notification')) hasDisplays = true;
    });

    if (hasMust) score += 3;
    if (hasCan) score += 3;
    if (hasDisplays) score += 4;
  } else {
    // Gherkin: check for Given/When/Then coverage
    let hasContext = false;
    let hasAction = false;
    let hasOutcome = false;

    criteria.forEach(criterion => {
      const lower = criterion.toLowerCase();
      if (GHERKIN_KEYWORDS.given.some(kw => lower.includes(kw))) hasContext = true;
      if (GHERKIN_KEYWORDS.when.some(kw => lower.includes(kw))) hasAction = true;
      if (GHERKIN_KEYWORDS.then.some(kw => lower.includes(kw))) hasOutcome = true;
    });

    if (hasContext) score += 3;
    if (hasAction) score += 3;
    if (hasOutcome) score += 4;
  }
  
  // Award points for having multiple criteria (applies to both formats)
  if (criteria.length >= 3) score += 3;
  if (criteria.length >= 5) score += 2;

  return Math.min(10, score);
}

/**
 * Detect the primary format used in criteria
 */
export function detectFormat(criteria) {
  if (!criteria || criteria.length === 0) {
    return 'none';
  }

  let gherkinCount = 0;
  let bulletCount = 0;

  criteria.forEach(criterion => {
    const lower = criterion.toLowerCase().trim();
    
    if (GHERKIN_KEYWORDS.given.some(kw => lower.startsWith(kw)) ||
        GHERKIN_KEYWORDS.when.some(kw => lower.startsWith(kw)) ||
        GHERKIN_KEYWORDS.then.some(kw => lower.startsWith(kw))) {
      gherkinCount++;
    } else if (lower.startsWith('the system') || lower.startsWith('the user') ||
               lower.startsWith('user can') || lower.startsWith('system must')) {
      bulletCount++;
    }
  });

  if (gherkinCount > bulletCount) {
    return 'gherkin';
  } else if (bulletCount > 0) {
    return 'bullet';
  } else {
    return 'mixed';
  }
}

/**
 * Score a single acceptance criterion in real-time with detailed breakdown
 * @param {string} criterion - The criterion text
 * @param {string} format - 'gherkin' or 'bullet'
 * @param {string} storyValue - Optional story value statement for alignment scoring
 * @returns {Object} Rating with score, grade, feedback, and breakdown
 */
export function scoreSingleCriterion(criterion, format = 'gherkin', storyValue = '') {
  if (!criterion || !criterion.trim()) {
    return { 
      score: 0, 
      grade: '', 
      color: '', 
      feedback: '', 
      maxScore: 10,
      breakdown: {
        format: { score: 0, maxScore: 4 },
        testability: { score: 0, maxScore: 3 },
        specificity: { score: 0, maxScore: 3 },
        alignment: { score: 0, maxScore: 2 }
      }
    };
  }

  const lower = criterion.toLowerCase().trim();
  let formatScore = 0;
  let testabilityScore = 0;
  let specificityScore = 0;
  let alignmentScore = 0;
  const feedback = [];
  const wordCount = criterion.trim().split(/\s+/).length;

  // Format check (0-4 points + possible bonus)
  if (format === 'gherkin') {
    const hasGiven = GHERKIN_KEYWORDS.given.some(() => lower.startsWith('given') || lower.includes('\ngiven '));
    const hasWhen = GHERKIN_KEYWORDS.when.some(() => lower.includes(' when ') || lower.startsWith('when ') || lower.includes('\nwhen '));
    const hasThen = GHERKIN_KEYWORDS.then.some(() => lower.includes(' then ') || lower.startsWith('then ') || lower.includes('\nthen '));
    const hasAnd = lower.includes('\nand ') || lower.includes(' and ');
    
    // Full Gherkin structure gets 4 points, bonus for And statements
    if ((hasGiven && hasWhen && hasThen) || (hasWhen && hasThen)) {
      formatScore += 4;
      // Bonus point for complex multi-clause Gherkin (with And)
      if (hasAnd) {
        formatScore += 1;
      }
    } else if (hasGiven || hasWhen || hasThen) {
      // Partial Gherkin: only 2 points
      formatScore += 2;
      feedback.push('Include Given/When/Then structure');
    } else {
      // Not Gherkin at all: minimal points
      formatScore += 0;
      feedback.push('Use Gherkin format: Given/When/Then');
    }
  } else {
    // Bullet format - stricter requirement for proper prefix
    if (lower.startsWith('the system') || lower.startsWith('the user')) {
      formatScore += 4;
    } else if (lower.startsWith('user can') || lower.startsWith('system must')) {
      formatScore += 3;
    } else {
      // Give 1 point for effort if it has observable patterns but wrong prefix
      const hasObservablePatterns = OBSERVABLE_PATTERNS.some(pattern => lower.includes(pattern));
      if (hasObservablePatterns) {
        formatScore += 1;
      }
      feedback.push('Start with "The system..." or "The user..."');
    }
  }

  // Testability check (0-3 points)
  // Check for observable patterns but exclude context-only usage
  const contextOnlyRegex = /\b(on the page|to the page|from the (page|click))\b/i;
  const isContextOnly = contextOnlyRegex.test(lower);
  
  const hasObservablePattern = OBSERVABLE_PATTERNS.some(pattern => lower.includes(pattern));
  const hasObservable = hasObservablePattern && !isContextOnly;
  
  // Check word count for conciseness FIRST (to prioritize concise feedback for long text)
  if (wordCount > 50) {
    // Very long but has observable
    if (hasObservable) {
      testabilityScore += 2; // Some points for having observable
    } else {
      testabilityScore += 1;
    }
  } else if (hasObservable && wordCount >= 8) {
    testabilityScore += 3; // Full testability points for detailed observable  
  } else if (hasObservable && wordCount >= 5) {
    testabilityScore += 2; // Has observable but could be more detailed
  } else if (hasObservable) {
    testabilityScore += 1; // Has observable but very brief
  } else {
    // No observable outcome - give 1 point for proper format at least
    testabilityScore += 1;
    if (wordCount <= 50) { // Only suggest observable if not too long
      feedback.push('Add observable outcome (e.g., "displays", "shows")');
    }
  }

  // Specificity check (0-3 points)
  const hasVague = VAGUE_TERMS.some(term => lower.includes(term));
  
  // Check for specific, measurable details (UI elements, numbers, technical terms)
  const hasSpecifics = /\b(button|field|message|error|success|page|form|table|list|menu|icon|label|input|filter|status|data|profile|category|date|range|sidebar)\b/i.test(criterion) ||
                       /\b(status code|response|timeout|limit|maximum|minimum|authentication|token|endpoint|api)\b/i.test(criterion) ||
                       /\b\d+\b/.test(criterion); // Has numbers
  
  // Generic action verbs that don't count as specific
  const hasGenericVerbs = /\b(responds?|works?|happens?|processes?|completes?|finishes?)\b/i.test(criterion);
  
  if (hasVague) {
    specificityScore += 0;
    feedback.push('Avoid vague terms');
  } else if (wordCount > 50) {
    // Very long - penalize for lack of conciseness
    specificityScore += 1;
    feedback.push('Too wordy - be more concise');
  } else if (hasGenericVerbs && !hasSpecifics) {
    // Generic verbs without specifics (e.g., "the system responds")
    specificityScore += 1;
    feedback.push('Add more detail');
  } else if (!hasSpecifics && wordCount < 8) {
    // Too brief and not specific
    specificityScore += 1;
    feedback.push('Add more detail');
  } else if (hasSpecifics && wordCount >= 12) {
    // Specific, detailed, and comprehensive (e.g., "filter by category, date range, and status")
    specificityScore += 3;
  } else if (hasSpecifics && wordCount >= 8) {
    // Specific and detailed
    specificityScore += 2;
  } else {
    // Middle ground - decent length but not specific enough
    specificityScore += 1;
  }

  // Alignment check (0-2 points) - does criterion relate to story value?
  if (storyValue && storyValue.trim()) {
    const storyLower = storyValue.toLowerCase();
    const criterionLower = criterion.toLowerCase();
    
    // Extract key value verbs and metrics from story
    const valueVerbs = ['reduce', 'increase', 'improve', 'enable', 'save', 'automate', 'simplify', 'enhance', 'prevent', 'ensure'];
    const foundVerbs = valueVerbs.filter(verb => storyLower.includes(verb));
    
    // Check if criterion mentions same concepts
    const hasSharedVerbs = foundVerbs.some(verb => criterionLower.includes(verb));
    
    // Extract key nouns/metrics (simple word matching)
    const storyWords = storyLower.split(/\s+/).filter(w => w.length > 4);
    const criterionWords = criterionLower.split(/\s+/).filter(w => w.length > 4);
    const sharedWords = storyWords.filter(w => criterionWords.includes(w));
    
    if (hasSharedVerbs || sharedWords.length >= 2) {
      alignmentScore = 2; // Strong alignment
    } else if (sharedWords.length === 1) {
      alignmentScore = 1; // Weak alignment
    } else {
      alignmentScore = 0; // No clear alignment
    }
  } else {
    // No story value provided, award neutral score
    alignmentScore = 1;
  }

  const totalScore = formatScore + testabilityScore + specificityScore + alignmentScore;

  // Calculate grade with format-specific thresholds (~90%, ~67%, ~50%)
  // Gherkin max: 13 (5+3+3+2), Bullet max: 12 (4+3+3+2)
  const excellentThreshold = format === 'gherkin' ? 12 : 11;
  const goodThreshold = format === 'gherkin' ? 9 : 8;
  const fairThreshold = format === 'gherkin' ? 7 : 6;
  
  let grade, color;
  if (totalScore >= excellentThreshold) {
    grade = 'Excellent';
    color = 'green';
  } else if (totalScore >= goodThreshold) {
    grade = 'Good';
    color = 'blue';
  } else if (totalScore >= fairThreshold) {
    grade = 'Fair';
    color = 'yellow';
  } else {
    grade = 'Needs work';
    color = 'orange';
  }

  return {
    score: totalScore,
    maxScore: format === 'gherkin' ? 13 : 12, // Gherkin: 5+3+3+2=13, Bullet: 4+3+3+2=12
    grade,
    color,
    feedback: feedback.join(' • '),
    breakdown: {
      format: { 
        score: formatScore, 
        maxScore: format === 'gherkin' ? 5 : 4, // Gherkin can get bonus point
        label: 'Format'
      },
      testability: { 
        score: testabilityScore, 
        maxScore: 3,
        label: 'Testability'
      },
      specificity: { 
        score: specificityScore, 
        maxScore: 3,
        label: 'Specificity'
      },
      alignment: { 
        score: alignmentScore, 
        maxScore: 2,
        label: 'Alignment'
      }
    }
  };
}

/**
 * Check for criteria-specific achievements
 */
export function checkCriteriaAchievements(criteriaScore, criteriaCount, breakdown) {
  const achievements = [];
  const getAchievement = (id) => CRITERIA_ACHIEVEMENT_CATALOG.find((achievement) => achievement.id === id);

  if (criteriaScore >= 50) {
    achievements.push(getAchievement('testability-master'));
  }

  if (breakdown.format >= 9) {
    achievements.push(getAchievement('gherkin-guru'));
  }

  if (breakdown.testability >= 14) {
    achievements.push(getAchievement('observable-outcomes'));
  }

  if (criteriaCount >= 5 && criteriaScore >= 45) {
    achievements.push(getAchievement('comprehensive-coverage'));
  }

  return achievements;
}
