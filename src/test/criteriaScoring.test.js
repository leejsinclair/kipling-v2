import { describe, it, expect } from 'vitest';
import { 
  scoreCriteria, 
  detectFormat, 
  checkCriteriaAchievements,
  scoreSingleCriterion
} from '../criteriaScoring';

describe('scoreCriteria', () => {
  it('should return 0 score for empty criteria', () => {
    const result = scoreCriteria([]);
    expect(result.totalScore).toBe(0);
    expect(result.feedback).toContain('Please add at least one acceptance criterion');
  });

  it('should score Gherkin format criteria highly', () => {
    const criteria = [
      'Given I am logged in as an admin',
      'When I click the export button',
      'Then I see a download confirmation message'
    ];
    
    const result = scoreCriteria(criteria);
    expect(result.breakdown.format).toBeGreaterThanOrEqual(8);
    expect(result.breakdown.completeness).toBeGreaterThan(5);
  });

  it('should score bullet-point format criteria', () => {
    const criteria = [
      'The system must validate user input',
      'The user can export data as CSV',
      'The page displays error messages for invalid data'
    ];
    
    const result = scoreCriteria(criteria);
    expect(result.breakdown.format).toBeGreaterThanOrEqual(5);
  });

  it('should score bullet format against bullet rules when selected', () => {
    const criteria = [
      'The system must validate user input',
      'The user can export data as CSV',
      'The page displays error messages for invalid data'
    ];

    const result = scoreCriteria(criteria, '', 'bullet');
    expect(result.breakdown.format).toBeGreaterThanOrEqual(8);
    expect(result.feedback).not.toContain('Consider using Gherkin format (Given/When/Then) for clearer criteria.');
  });

  it('should favor gherkin formatting when gherkin is selected', () => {
    const criteria = [
      'The system must validate user input',
      'The user can export data as CSV',
      'The page displays error messages for invalid data'
    ];

    const gherkinSelected = scoreCriteria(criteria, '', 'gherkin');
    const bulletSelected = scoreCriteria(criteria, '', 'bullet');

    expect(bulletSelected.breakdown.format).toBeGreaterThanOrEqual(gherkinSelected.breakdown.format);
  });

  it('should reward testable, observable outcomes', () => {
    const criteria = [
      'The system displays a success message',
      'The user can see the exported file',
      'The page shows validation errors'
    ];
    
    const result = scoreCriteria(criteria);
    expect(result.breakdown.testability).toBeGreaterThan(5);
  });

  it('should penalize vague language', () => {
    const criteria = [
      'It should basically work',
      'The system kind of validates',
      'Maybe shows an error'
    ];
    
    const result = scoreCriteria(criteria);
    expect(result.breakdown.specificity).toBeLessThan(8);
  });

  it('should score alignment with story value', () => {
    const criteria = [
      'The system enables users to save time',
      'Users can reduce manual effort'
    ];
    const storyValue = 'I can save time and reduce manual effort';
    
    const result = scoreCriteria(criteria, storyValue);
    expect(result.breakdown.alignment).toBeGreaterThan(5);
  });

  it('should score alignment with UK/AU value verb spellings', () => {
    const criteria = [
      'The system should optimise the review workflow for analysts',
      'The user can minimise repetitive data entry during onboarding'
    ];
    const storyValue = 'I can optimise operations and minimise manual effort';

    const result = scoreCriteria(criteria, storyValue);
    expect(result.breakdown.alignment).toBeGreaterThan(5);
  });

  it('should return criteria count', () => {
    const criteria = ['criterion 1', 'criterion 2', 'criterion 3'];
    
    const result = scoreCriteria(criteria);
    expect(result.criteriaCount).toBe(3);
  });

  it('should provide feedback and suggestions', () => {
    const criteria = ['short'];
    
    const result = scoreCriteria(criteria);
    expect(result.feedback).toBeDefined();
    expect(result.suggestions).toBeDefined();
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('should cap total score at 55', () => {
    // Even with perfect criteria, score should not exceed 55
    const criteria = [
      'Given I am a premium user with admin privileges',
      'When I navigate to the export page and click download',
      'Then the system displays a success notification and I can access the file',
      'And the user can see detailed progress information',
      'And the system ensures data integrity'
    ];
    
    const result = scoreCriteria(criteria, 'I can save time and improve efficiency');
    expect(result.totalScore).toBeLessThanOrEqual(55);
  });

  it('should give full format score for bullet criteria when bullet format is selected', () => {
    const criteria = [
      'The system must validate user input before submission',
      'The user can export the results as a CSV file',
      'The system must display an error message for invalid data',
    ];

    const result = scoreCriteria(criteria, '', 'bullet');
    expect(result.breakdown.format).toBe(10);
  });

  it('should give full format score for Gherkin criteria when gherkin format is selected', () => {
    const criteria = [
      'Given I am logged in as an admin',
      'When I click the export button',
      'Then I see a download confirmation message',
    ];

    const result = scoreCriteria(criteria, '', 'gherkin');
    expect(result.breakdown.format).toBe(10);
  });

  it('should score lower when bullet criteria are submitted with gherkin format selected', () => {
    const criteria = [
      'The system must validate user input',
      'The user can export data as CSV',
      'The system must display error messages',
    ];

    const gherkinResult = scoreCriteria(criteria, '', 'gherkin');
    const bulletResult = scoreCriteria(criteria, '', 'bullet');
    expect(bulletResult.breakdown.format).toBeGreaterThan(gherkinResult.breakdown.format);
  });
});

describe('detectFormat', () => {
  it('should detect Gherkin format', () => {
    const criteria = [
      'Given I am logged in',
      'When I click export',
      'Then I see confirmation'
    ];
    
    const format = detectFormat(criteria);
    expect(format).toBe('gherkin');
  });

  it('should detect bullet-point format', () => {
    const criteria = [
      'The system must validate input',
      'The user can export data',
      'System must show errors'
    ];
    
    const format = detectFormat(criteria);
    expect(format).toBe('bullet');
  });

  it('should return "none" for empty criteria', () => {
    const format = detectFormat([]);
    expect(format).toBe('none');
  });

  it('should detect mixed format', () => {
    const criteria = [
      'Some random criterion',
      'Another criterion without structure'
    ];
    
    const format = detectFormat(criteria);
    expect(format).toBe('mixed');
  });
});

describe('checkCriteriaAchievements', () => {
  it('should award "Testability Master" for 50+ score', () => {
    const achievements = checkCriteriaAchievements(52, 3, {
      format: 10,
      testability: 15,
      specificity: 10,
      alignment: 10,
      completeness: 7
    });
    
    const hasMaster = achievements.some(a => a.id === 'testability-master');
    expect(hasMaster).toBe(true);
  });

  it('should award "Gherkin Guru" for perfect format', () => {
    const achievements = checkCriteriaAchievements(45, 3, {
      format: 9,
      testability: 12,
      specificity: 8,
      alignment: 8,
      completeness: 8
    });
    
    const hasGuru = achievements.some(a => a.id === 'gherkin-guru');
    expect(hasGuru).toBe(true);
  });

  it('should award "Observable Outcomes" for high testability', () => {
    const achievements = checkCriteriaAchievements(45, 3, {
      format: 8,
      testability: 14,
      specificity: 9,
      alignment: 7,
      completeness: 7
    });
    
    const hasObservable = achievements.some(a => a.id === 'observable-outcomes');
    expect(hasObservable).toBe(true);
  });

  it('should award "Comprehensive Coverage" for 5+ criteria with high score', () => {
    const achievements = checkCriteriaAchievements(48, 5, {
      format: 10,
      testability: 13,
      specificity: 9,
      alignment: 8,
      completeness: 8
    });
    
    const hasCoverage = achievements.some(a => a.id === 'comprehensive-coverage');
    expect(hasCoverage).toBe(true);
  });

  it('should return empty array for low scores', () => {
    const achievements = checkCriteriaAchievements(30, 2, {
      format: 5,
      testability: 8,
      specificity: 6,
      alignment: 5,
      completeness: 6
    });
    
    expect(achievements.length).toBe(0);
  });
});

describe('scoreSingleCriterion', () => {
  it('should return empty for empty criterion', () => {
    const result = scoreSingleCriterion('', 'gherkin');
    expect(result.score).toBe(0);
    expect(result.grade).toBe('');
  });

  it('should score excellent Gherkin criterion highly', () => {
    const result = scoreSingleCriterion(
      'Given I am logged in\nWhen I click the export button\nThen the system displays a success message',
      'gherkin'
    );
    expect(result.score).toBeGreaterThanOrEqual(9);
    expect(result.grade).toMatch(/Excellent|Good/); // Can be Excellent (≥12) or Good (9-11) for Gherkin
    expect(result.color).toMatch(/green|blue/);
  });

  it('should score good bullet criterion well', () => {
    const result = scoreSingleCriterion(
      'The system must display a validation error when invalid data is submitted',
      'bullet'
    );
    expect(result.score).toBeGreaterThanOrEqual(7);
    expect(result.grade).toMatch(/Good|Excellent/);
  });

  it('should provide feedback for incomplete Gherkin', () => {
    const result = scoreSingleCriterion(
      'Given I am logged in',
      'gherkin'
    );
    expect(result.feedback).toContain('Given/When/Then');
  });

  it('should provide feedback for vague language', () => {
    const result = scoreSingleCriterion(
      'The system should maybe do something',
      'bullet'
    );
    expect(result.feedback).toMatch(/vague|observable/i);
  });

  it('should penalize very short criteria', () => {
    const result = scoreSingleCriterion(
      'It works',
      'bullet'
    );
    expect(result.score).toBeLessThan(7);
    expect(result.feedback).toContain('Add more detail');
  });
});
