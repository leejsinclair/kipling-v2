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

// Observable outcome patterns
const OBSERVABLE_PATTERNS = [
  'system displays', 'user can', 'user is able to', 'system shows',
  'displays', 'shows', 'appears', 'is visible', 'is displayed',
  'user sees', 'application', 'page', 'button', 'field', 'message',
  'notification', 'alert', 'confirmation', 'error', 'success'
];

// Vague/weak terms to avoid
const VAGUE_TERMS = [
  'should basically', 'kind of works', 'sort of', 'mostly', 'probably',
  'might', 'maybe', 'could possibly', 'somewhat', 'generally'
];

// Value-oriented action verbs
const VALUE_VERBS = [
  'increase', 'reduce', 'enable', 'improve', 'access', 'save',
  'automate', 'simplify', 'enhance', 'provide', 'allow', 'ensure',
  'maintain', 'prevent', 'support', 'facilitate'
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
  breakdown.completeness = scoreCompleteness(criteria, format);

  // Calculate total (max 55 points for criteria, matching story max)
  totalScore = breakdown.format + breakdown.testability + breakdown.specificity + 
               breakdown.alignment + breakdown.completeness;

  // Generate feedback
  if (breakdown.format >= 8) {
    feedback.push('Excellent format! Your criteria follow a clear structure.');
  } else if (breakdown.format < 5) {
    if (format === 'bullet') {
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
    if (format === 'bullet') {
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
 * Check for criteria-specific achievements
 */
export function checkCriteriaAchievements(criteriaScore, criteriaCount, breakdown) {
  const achievements = [];

  if (criteriaScore >= 50) {
    achievements.push({
      id: 'testability-master',
      name: 'Testability Master',
      description: 'Scored 50+ points on acceptance criteria'
    });
  }

  if (breakdown.format >= 9) {
    achievements.push({
      id: 'gherkin-guru',
      name: 'Gherkin Guru',
      description: 'Perfect format score on acceptance criteria'
    });
  }

  if (breakdown.testability >= 14) {
    achievements.push({
      id: 'observable-outcomes',
      name: 'Observable Outcomes',
      description: 'Excellent testability score (14+)'
    });
  }

  if (criteriaCount >= 5 && criteriaScore >= 45) {
    achievements.push({
      id: 'comprehensive-coverage',
      name: 'Comprehensive Coverage',
      description: 'Wrote 5+ high-quality acceptance criteria'
    });
  }

  return achievements;
}
