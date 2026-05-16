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
  'maintain', 'prevent', 'support', 'facilitate',
  'optimise', 'minimise', 'maximise'
];

const VALUE_VERB_GROUPS = {
  reduce: ['reduce', 'decrease', 'lower', 'minimize', 'minimise', 'cut'],
  increase: ['increase', 'raise', 'grow', 'boost'],
  improve: ['improve', 'enhance', 'optimize', 'optimise', 'refine'],
  enable: ['enable', 'allow', 'permit', 'facilitate'],
  save: ['save', 'conserve'],
  automate: ['automate', 'streamline'],
  ensure: ['ensure', 'guarantee', 'verify'],
  prevent: ['prevent', 'avoid', 'block'],
};

const EMPTY_CRITERIA_RESULT = {
  totalScore: 0,
  breakdown: {},
  feedback: ['Please add at least one acceptance criterion'],
  suggestions: []
};

const SINGLE_CRITERION_EMPTY_BREAKDOWN = {
  format: { score: 0, maxScore: 4 },
  testability: { score: 0, maxScore: 3 },
  specificity: { score: 0, maxScore: 3 },
  alignment: { score: 0, maxScore: 2 }
};

const FORMAT_HINT_RULES = [
  {
    shouldAdd: ({ breakdown }) => (breakdown.testability ?? 0) < 10,
    message: 'Use observable outcomes in Then steps: status code, UI message, redirect, audit log, or notification.'
  },
  {
    shouldAdd: ({ breakdown }) => (breakdown.specificity ?? 0) < 8,
    message: 'Use concrete actors, actions, and data values. Avoid vague verbs like "responds" without explicit result details.'
  },
  {
    shouldAdd: ({ breakdown, storyValue }) => (breakdown.alignment ?? 0) < 8 && Boolean(storyValue),
    message: 'Reuse key value words from the story "So that" statement (for example reduce/increase/improve and the target metric/domain term).'
  },
  {
    shouldAdd: ({ selectedFormat }) => selectedFormat === 'gherkin',
    message: 'Keep each criterion focused on one primary behavior/outcome. Split overloaded criteria into smaller Given/When/Then criteria.'
  },
  {
    shouldAdd: ({ criteriaCount }) => criteriaCount < 3,
    message: 'Add at least one additional criterion to cover validation/error behavior.'
  }
];

/**
 * Creates the default empty single-criterion rating payload.
 * @returns {{score: number, grade: string, color: string, feedback: string, maxScore: number, breakdown: object}}
 */
function createEmptySingleCriterionRating() {
  return {
    score: 0,
    grade: '',
    color: '',
    feedback: '',
    maxScore: 10,
    breakdown: SINGLE_CRITERION_EMPTY_BREAKDOWN
  };
}

/**
 * Adds feedback only once so refactored scorers can compose messages safely.
 * @param {string[]} target
 * @param {string} message
 */
function addUniqueMessage(target, message) {
  if (message && !target.includes(message)) {
    target.push(message);
  }
}

/**
 * Score acceptance criteria
 * @param {Array<string>} criteria - Array of acceptance criteria strings
 * @param {string} storyValue - The "So that..." value statement from the story
 * @param {string} selectedFormat - The format chosen by the user ('gherkin' or 'bullet')
 * @returns {Object} Score breakdown and feedback
 */
export function scoreCriteria(criteria, storyValue = '', selectedFormat = 'gherkin') {
  if (!criteria || criteria.length === 0) {
    return EMPTY_CRITERIA_RESULT;
  }

  const breakdown = {
    format: scoreFormat(criteria, selectedFormat),
    testability: scoreTestability(criteria),
    specificity: scoreSpecificity(criteria),
    alignment: scoreAlignment(criteria, storyValue),
    completeness: scoreCompleteness(criteria, selectedFormat)
  };
  const totalScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const feedback = buildCriteriaFeedback(breakdown, selectedFormat, storyValue);
  const suggestions = buildCriteriaSuggestions(breakdown, selectedFormat, criteria.length);

  const hintTargets = generateCriteriaHintTargets({
    criteria,
    storyValue,
    selectedFormat,
    breakdown,
  });

  return {
    totalScore: Math.min(55, totalScore), // Cap at 55 to match story scoring
    breakdown,
    feedback,
    suggestions,
    hintTargets,
    criteriaCount: criteria.length
  };
}

function generateCriteriaHintTargets({ criteria, storyValue, selectedFormat, breakdown }) {
  const criteriaCount = Array.isArray(criteria) ? criteria.length : 0;
  return FORMAT_HINT_RULES
    .filter(({ shouldAdd }) => shouldAdd({ breakdown, storyValue, selectedFormat, criteriaCount }))
    .map(({ message }) => message)
    .slice(0, 5);
}

/**
 * Score format (Gherkin or bullet-point structure)
 * Max: 10 points
 * @param {Array<string>} criteria
 * @param {string} selectedFormat - 'gherkin' or 'bullet'
 */
function scoreFormat(criteria, selectedFormat = 'gherkin') {
  let score;
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
  const coverage = selectedFormat === 'bullet'
    ? getBulletCompletenessCoverage(criteria)
    : getGherkinCompletenessCoverage(criteria);
  const countScore = getCriteriaCountCompletenessScore(criteria.length);

  return Math.min(10, coverage + countScore);
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
    return createEmptySingleCriterionRating();
  }

  const lower = criterion.toLowerCase().trim();
  const feedback = [];
  const wordCount = criterion.trim().split(/\s+/).length;
  const formatResult = scoreSingleCriterionFormat(lower, format);
  const testabilityResult = scoreSingleCriterionTestability(lower, wordCount);
  const specificityResult = scoreSingleCriterionSpecificity(criterion, lower, wordCount);
  const alignmentScore = scoreSingleCriterionAlignment(criterion, storyValue);
  [formatResult.feedback, testabilityResult.feedback, specificityResult.feedback]
    .flat()
    .forEach((message) => addUniqueMessage(feedback, message));

  const totalScore = formatResult.score + testabilityResult.score + specificityResult.score + alignmentScore;
  const { grade, color } = getSingleCriterionGrade(totalScore, format);
  const maxScore = format === 'gherkin' ? 13 : 12;

  return {
    score: totalScore,
    maxScore,
    grade,
    color,
    feedback: feedback.join(' • '),
    breakdown: buildSingleCriterionBreakdown({
      format,
      formatScore: formatResult.score,
      testabilityScore: testabilityResult.score,
      specificityScore: specificityResult.score,
      alignmentScore
    })
  };
}

/**
 * Builds score-level feedback for a criteria set.
 * @param {Record<string, number>} breakdown
 * @param {'gherkin' | 'bullet'} selectedFormat
 * @param {string} storyValue
 * @returns {string[]}
 */
function buildCriteriaFeedback(breakdown, selectedFormat, storyValue) {
  const feedback = [];

  if (breakdown.format >= 8) {
    feedback.push('Excellent format! Your criteria follow a clear structure.');
  } else if (breakdown.format < 5) {
    feedback.push(
      selectedFormat === 'bullet'
        ? 'Consider starting each criterion with "The system must..." or "The user can..." for clearer criteria.'
        : 'Consider using Gherkin format (Given/When/Then) for clearer criteria.'
    );
  }

  if (breakdown.testability >= 12) {
    feedback.push('Great testability! Your criteria have clear, observable outcomes.');
  } else if (breakdown.testability < 8) {
    feedback.push('Make your criteria more testable with specific, observable outcomes.');
  }

  feedback.push(
    breakdown.specificity >= 8
      ? 'Nice specificity! Your criteria are clear and unambiguous.'
      : 'Avoid vague language. Be more specific about expected behaviours.'
  );

  if (breakdown.alignment >= 8) {
    feedback.push('Your criteria align well with the story\'s value proposition.');
  } else if (storyValue) {
    feedback.push('Try to align your criteria more closely with the story\'s "So that..." value.');
  }

  if (breakdown.completeness >= 8) {
    feedback.push('Comprehensive criteria covering the full scenario.');
  }

  return feedback;
}

/**
 * Builds actionable improvement suggestions for a criteria set.
 * @param {Record<string, number>} breakdown
 * @param {'gherkin' | 'bullet'} selectedFormat
 * @param {number} criteriaCount
 * @returns {string[]}
 */
function buildCriteriaSuggestions(breakdown, selectedFormat, criteriaCount) {
  const suggestions = [];

  if (breakdown.format < 8) {
    suggestions.push(
      selectedFormat === 'bullet'
        ? 'Try starting each criterion with "The system must...", "The user can...", or "The page displays..."'
        : 'Try using "Given [context], When [action], Then [outcome]" format'
    );
  }

  if (breakdown.testability < 10) {
    suggestions.push('Include observable outcomes like "system displays..." or "user can..."');
  }

  if (breakdown.specificity < 8) {
    suggestions.push('Replace vague terms with specific, measurable criteria');
  }

  if (criteriaCount < 3) {
    suggestions.push('Consider adding more criteria to cover edge cases and variations');
  }

  return suggestions;
}

/**
 * Calculates bullet-format completeness coverage points.
 * @param {string[]} criteria
 * @returns {number}
 */
function getBulletCompletenessCoverage(criteria) {
  let hasMust = false;
  let hasCan = false;
  let hasDisplays = false;

  criteria.forEach((criterion) => {
    const lower = criterion.toLowerCase();
    hasMust ||= lower.includes('must') || lower.includes('shall');
    hasCan ||= lower.includes('can') || lower.includes('able to');
    hasDisplays ||= ['display', 'show', 'appear', 'message', 'notification'].some((term) => lower.includes(term));
  });

  return (hasMust ? 3 : 0) + (hasCan ? 3 : 0) + (hasDisplays ? 4 : 0);
}

/**
 * Calculates Gherkin-format completeness coverage points.
 * @param {string[]} criteria
 * @returns {number}
 */
function getGherkinCompletenessCoverage(criteria) {
  let hasContext = false;
  let hasAction = false;
  let hasOutcome = false;

  criteria.forEach((criterion) => {
    const lower = criterion.toLowerCase();
    hasContext ||= GHERKIN_KEYWORDS.given.some((kw) => lower.includes(kw));
    hasAction ||= GHERKIN_KEYWORDS.when.some((kw) => lower.includes(kw));
    hasOutcome ||= GHERKIN_KEYWORDS.then.some((kw) => lower.includes(kw));
  });

  return (hasContext ? 3 : 0) + (hasAction ? 3 : 0) + (hasOutcome ? 4 : 0);
}

/**
 * Returns the count-based completeness bonus for multiple criteria.
 * @param {number} criteriaCount
 * @returns {number}
 */
function getCriteriaCountCompletenessScore(criteriaCount) {
  if (criteriaCount >= 5) return 5;
  if (criteriaCount >= 3) return 3;
  return 0;
}

/**
 * Scores the format dimension for a single criterion.
 * @param {string} lower
 * @param {'gherkin' | 'bullet'} format
 * @returns {{score: number, feedback: string[]}}
 */
function scoreSingleCriterionFormat(lower, format) {
  if (format === 'gherkin') {
    return scoreGherkinCriterionFormat(lower);
  }

  return scoreBulletCriterionFormat(lower);
}

/**
 * Scores Gherkin structure for a single criterion.
 * @param {string} lower
 * @returns {{score: number, feedback: string[]}}
 */
function scoreGherkinCriterionFormat(lower) {
  const hasGiven = matchesAnyPattern(lower, ['given', '\ngiven '], { startsWithFirst: true });
  const hasWhen = matchesAnyPattern(lower, [' when ', 'when ', '\nwhen '], { startsWithFirst: false });
  const hasThen = matchesAnyPattern(lower, [' then ', 'then ', '\nthen '], { startsWithFirst: false });
  const hasAnd = lower.includes('\nand ') || lower.includes(' and ');
  const presentKeywords = [hasGiven, hasWhen, hasThen].filter(Boolean).length;
  const hasFullStructure = hasWhen && presentKeywords >= 2;

  if (hasFullStructure) {
    return { score: hasAnd ? 5 : 4, feedback: [] };
  }

  if (presentKeywords > 0) {
    return { score: 2, feedback: ['Include Given/When/Then structure'] };
  }

  return { score: 0, feedback: ['Use Gherkin format: Given/When/Then'] };
}

/**
 * Scores bullet-style structure for a single criterion.
 * @param {string} lower
 * @returns {{score: number, feedback: string[]}}
 */
function scoreBulletCriterionFormat(lower) {
  if (lower.startsWith('the system') || lower.startsWith('the user')) {
    return { score: 4, feedback: [] };
  }

  if (lower.startsWith('user can') || lower.startsWith('system must')) {
    return { score: 3, feedback: [] };
  }

  const hasObservablePatterns = OBSERVABLE_PATTERNS.some((pattern) => lower.includes(pattern));
  return {
    score: hasObservablePatterns ? 1 : 0,
    feedback: ['Start with "The system..." or "The user..."']
  };
}

/**
 * Scores observable outcomes for a single criterion.
 * @param {string} lower
 * @param {number} wordCount
 * @returns {{score: number, feedback: string[]}}
 */
function scoreSingleCriterionTestability(lower, wordCount) {
  const contextOnlyRegex = /\b(on the page|to the page|from the (page|click))\b/i;
  const hasObservablePattern = OBSERVABLE_PATTERNS.some((pattern) => lower.includes(pattern));
  const hasObservable = hasObservablePattern && !contextOnlyRegex.test(lower);
  const observablePatternCount = OBSERVABLE_PATTERNS.filter((pattern) => lower.includes(pattern)).length;

  if (wordCount > 50) {
    return { score: getLongCriterionTestabilityScore(hasObservable, observablePatternCount), feedback: [] };
  }

  if (hasObservable) {
    return { score: getObservableTestabilityScore(wordCount), feedback: [] };
  }

  return {
    score: 1,
    feedback: wordCount <= 50 ? ['Add observable outcome (e.g., "displays", "shows")'] : []
  };
}

/**
 * Scores specificity for a single criterion.
 * @param {string} criterion
 * @param {string} lower
 * @param {number} wordCount
 * @returns {{score: number, feedback: string[]}}
 */
function scoreSingleCriterionSpecificity(criterion, lower, wordCount) {
  const hasVague = VAGUE_TERMS.some((term) => lower.includes(term));
  const hasSpecifics = hasCriterionSpecifics(criterion);
  const technicalSpecificCount = (
    criterion.match(/\b(status|response|audit|timestamp|inventory|database|endpoint|api|token|notification|workflow|transaction|validation|error|table|record)\b/gi) || []
  ).length;
  const hasGenericVerbs = /\b(responds?|works?|happens?|processes?|completes?|finishes?)\b/i.test(criterion);

  if (hasVague) {
    return { score: 0, feedback: ['Avoid vague terms'] };
  }

  if (wordCount > 50) {
    return getLongCriterionSpecificityResult(hasSpecifics, technicalSpecificCount);
  }

  if ((hasGenericVerbs && !hasSpecifics) || (!hasSpecifics && wordCount < 8)) {
    return { score: 1, feedback: ['Add more detail'] };
  }

  return { score: getSpecificityScore(hasSpecifics, wordCount), feedback: [] };
}

/**
 * Scores how well a criterion reinforces the story value statement.
 * @param {string} criterion
 * @param {string} storyValue
 * @returns {number}
 */
function scoreSingleCriterionAlignment(criterion, storyValue) {
  if (!storyValue || !storyValue.trim()) {
    return 1;
  }

  const storyLower = storyValue.toLowerCase();
  const criterionLower = criterion.toLowerCase();
  const foundVerbs = VALUE_VERBS.filter((verb) => storyLower.includes(verb));
  const matchingVerbGroups = Object.values(VALUE_VERB_GROUPS).filter((group) =>
    group.some((verb) => storyLower.includes(verb)),
  );
  const hasSharedVerbs = foundVerbs.some((verb) => criterionLower.includes(verb));
  const hasSharedVerbSynonym = matchingVerbGroups.some((group) => group.some((verb) => criterionLower.includes(verb)));
  const storyWords = storyLower.split(/\s+/).filter((word) => word.length > 4);
  const criterionWords = criterionLower.split(/\s+/).filter((word) => word.length > 4);
  const sharedWords = storyWords.filter((word) => criterionWords.includes(word));

  if (hasSharedVerbs || hasSharedVerbSynonym || sharedWords.length >= 2) return 2;
  if (sharedWords.length === 1) return 1;
  return 0;
}

/**
 * Converts a single-criterion score into the displayed grade metadata.
 * @param {number} totalScore
 * @param {'gherkin' | 'bullet'} format
 * @returns {{grade: string, color: string}}
 */
function getSingleCriterionGrade(totalScore, format) {
  const excellentThreshold = format === 'gherkin' ? 12 : 11;
  const goodThreshold = format === 'gherkin' ? 9 : 8;
  const fairThreshold = format === 'gherkin' ? 7 : 6;

  if (totalScore >= excellentThreshold) return { grade: 'Excellent', color: 'green' };
  if (totalScore >= goodThreshold) return { grade: 'Good', color: 'blue' };
  if (totalScore >= fairThreshold) return { grade: 'Fair', color: 'yellow' };
  return { grade: 'Needs work', color: 'orange' };
}

/**
 * Builds the per-dimension breakdown payload for a single criterion.
 * @param {{format: 'gherkin' | 'bullet', formatScore: number, testabilityScore: number, specificityScore: number, alignmentScore: number}} input
 * @returns {object}
 */
function buildSingleCriterionBreakdown({
  format,
  formatScore,
  testabilityScore,
  specificityScore,
  alignmentScore
}) {
  return {
    format: {
      score: formatScore,
      maxScore: format === 'gherkin' ? 5 : 4,
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
  };
}

/**
 * Checks whether text starts with or contains any of the provided patterns.
 * @param {string} text
 * @param {string[]} patterns
 * @param {{startsWithFirst: boolean}} options
 * @returns {boolean}
 */
function matchesAnyPattern(text, patterns, { startsWithFirst }) {
  const [startPattern, ...includePatterns] = patterns;
  return (
    (startsWithFirst && text.startsWith(startPattern)) ||
    includePatterns.some((pattern) => text.includes(pattern))
  );
}

/**
 * Returns the testability score band for long criteria.
 * @param {boolean} hasObservable
 * @param {number} observablePatternCount
 * @returns {number}
 */
function getLongCriterionTestabilityScore(hasObservable, observablePatternCount) {
  if (hasObservable && observablePatternCount >= 3) return 3;
  if (hasObservable) return 2;
  return 1;
}

/**
 * Returns the testability score band for observable criteria by length.
 * @param {number} wordCount
 * @returns {number}
 */
function getObservableTestabilityScore(wordCount) {
  if (wordCount >= 8) return 3;
  if (wordCount >= 5) return 2;
  return 1;
}

/**
 * Returns the specificity score band for the supplied criterion details.
 * @param {boolean} hasSpecifics
 * @param {number} wordCount
 * @returns {number}
 */
function getSpecificityScore(hasSpecifics, wordCount) {
  if (hasSpecifics && wordCount >= 12) return 3;
  if (hasSpecifics && wordCount >= 8) return 2;
  return 1;
}

/**
 * Checks whether a criterion contains concrete UI, technical, or numeric details.
 * @param {string} criterion
 * @returns {boolean}
 */
function hasCriterionSpecifics(criterion) {
  return [
    /\b(button|field|message|error|success|page|form|table|list|menu|icon|label|input|filter|status|data|profile|category|date|range|sidebar)\b/i,
    /\b(status code|response|timeout|limit|maximum|minimum|authentication|token|endpoint|api)\b/i,
    /\b\d+\b/
  ].some((pattern) => pattern.test(criterion));
}

/**
 * Returns the specificity result for long criteria.
 * @param {boolean} hasSpecifics
 * @param {number} technicalSpecificCount
 * @returns {{score: number, feedback: string[]}}
 */
function getLongCriterionSpecificityResult(hasSpecifics, technicalSpecificCount) {
  if (hasSpecifics && technicalSpecificCount >= 4) {
    return { score: 2, feedback: ['Detailed criterion is good; consider splitting for conciseness'] };
  }

  return { score: 1, feedback: ['Too wordy - be more concise'] };
}

/**
 * All possible criteria achievements (used for badge display)
 */
export const CRITERIA_BADGES = [
  {
    id: 'testability-master',
    emoji: '🧪',
    name: 'Testability Master',
    description: 'Score 50+ points on acceptance criteria'
  },
  {
    id: 'gherkin-guru',
    emoji: '🥒',
    name: 'Gherkin Guru',
    description: 'Achieve a perfect format score on acceptance criteria'
  },
  {
    id: 'observable-outcomes',
    emoji: '🔭',
    name: 'Observable Outcomes',
    description: 'Achieve an excellent testability score (14+)'
  },
  {
    id: 'comprehensive-coverage',
    emoji: '🗂️',
    name: 'Comprehensive Coverage',
    description: 'Write 5 or more high-quality acceptance criteria'
  }
];

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
