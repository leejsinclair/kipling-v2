import { describe, it, expect } from 'vitest';
import { scoreSingleCriterion } from '../criteriaScoring';

describe('scoreSingleCriterion', () => {
  // Gherkin Format Tests
  describe('Gherkin Format - Excellent (12-13 points)', () => {
    it('should score well for complete Given/When/Then with observable outcome', () => {
      const result = scoreSingleCriterion(
        'Given the user is logged in\nWhen they click the export button\nThen the system displays a download confirmation',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toMatch(/Excellent|Good/);
    });

    it('should score highly for When/Then with specific observable outcome', () => {
      const result = scoreSingleCriterion(
        'When the user submits the form\nThen the system shows a success message and redirects to the dashboard',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(12);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for complex And statements', () => {
      const result = scoreSingleCriterion(
        'Given the user has entered invalid email\nAnd the password field is empty\nWhen they click submit\nThen the system displays inline validation errors',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(12);
      expect(result.grade).toBe('Excellent');
    });

    it('should score well for specific field validation', () => {
      const result = scoreSingleCriterion(
        'Given the email field contains an invalid format\nWhen the user tabs away from the field\nThen an error message appears below the field',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toMatch(/Excellent|Good/);
    });
  });

  describe('Gherkin Format - Good (9-11 points)', () => {
    it('should score good for Given/When/Then without clear observable', () => {
      const result = scoreSingleCriterion(
        'Given the user is on the page\nWhen they perform an action\nThen the system responds',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(9);
      expect(result.score).toBeLessThan(12);
      expect(result.grade).toBe('Good');
      expect(result.color).toBe('blue');
    });

    it('should score fair when missing observable outcome', () => {
      const result = scoreSingleCriterion(
        'Given a valid user\nWhen they authenticate\nThen access is granted',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(7);
      expect(result.score).toBeLessThan(9);
    });
  });

  describe('Gherkin Format - Fair (7-8 points)', () => {
    it('should score fair for incomplete Gherkin structure', () => {
      const result = scoreSingleCriterion(
        'When the user clicks submit\nThen something happens',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(7);
      expect(result.score).toBeLessThan(9);
      expect(result.grade).toBe('Fair');
      expect(result.color).toBe('yellow');
    });

    it('should score fair for vague Gherkin', () => {
      const result = scoreSingleCriterion(
        'Given that the system is kind of ready\nWhen something basically happens\nThen it might work',
        'gherkin'
      );
      expect(result.score).toBeLessThan(9);
      expect(result.feedback).toContain('vague');
    });
  });

  describe('Gherkin Format - Needs Work (<7 points)', () => {
    it('should score low for non-Gherkin format', () => {
      const result = scoreSingleCriterion(
        'The button should work correctly',
        'gherkin'
      );
      expect(result.score).toBeLessThan(7);
      expect(result.grade).toBe('Needs work');
      expect(result.color).toBe('orange');
      expect(result.feedback).toContain('Gherkin');
    });

    it('should score low for extremely brief statement', () => {
      const result = scoreSingleCriterion(
        'It works',
        'gherkin'
      );
      expect(result.score).toBeLessThan(7);
    });

    it('should score low for vague and brief', () => {
      const result = scoreSingleCriterion(
        'Maybe it kind of works',
        'gherkin'
      );
      expect(result.score).toBeLessThan(7);
    });
  });

  // Bullet Point Format Tests
  describe('Bullet Format - Excellent (11-12 points)', () => {
    it('should score highly for clear system behavior', () => {
      const result = scoreSingleCriterion(
        'The system displays a confirmation message with the order number and redirects to the order details page',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toBe('Excellent');
      expect(result.color).toBe('green');
    });

    it('should score highly for user capability statement', () => {
      const result = scoreSingleCriterion(
        'The user can filter search results by category, date range, and status using the sidebar filters',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for validation criteria', () => {
      const result = scoreSingleCriterion(
        'The system shows inline error messages below each invalid field when the user submits the form',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toBe('Excellent');
    });

    it('should score good for specific UI behavior', () => {
      const result = scoreSingleCriterion(
        'System must display a loading spinner while the API request is in progress and disable the submit button',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(9);
      expect(result.score).toBeLessThan(11);
      expect(result.grade).toBe('Good');
    });
  });

  describe('Bullet Format - Good (8-10 points)', () => {
    it('should score good for correct format but less specific', () => {
      const result = scoreSingleCriterion(
        'The system shows the results to the user',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.score).toBeLessThan(11);
    });

    it('should score good with proper start but vague outcome', () => {
      const result = scoreSingleCriterion(
        'The user can access the features easily',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.score).toBeLessThan(11);
    });
  });

  describe('Bullet Format - Fair (6-7 points)', () => {
    it('should score fair for missing proper prefix', () => {
      const result = scoreSingleCriterion(
        'Validation errors are shown to users when they make mistakes',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(6);
      expect(result.score).toBeLessThan(8);
      expect(result.grade).toBe('Fair');
    });

    it('should score fair for brief but clear statement', () => {
      const result = scoreSingleCriterion(
        'Error messages appear',
        'bullet'
      );
      expect(result.score).toBeLessThan(8);
    });
  });

  describe('Bullet Format - Needs Work (<6 points)', () => {
    it('should score low for extremely vague', () => {
      const result = scoreSingleCriterion(
        'It should basically work',
        'bullet'
      );
      expect(result.score).toBeLessThan(6);
      expect(result.grade).toBe('Needs work');
      expect(result.feedback).toContain('system');
    });

    it('should score low for too brief', () => {
      const result = scoreSingleCriterion(
        'Works fine',
        'bullet'
      );
      expect(result.score).toBeLessThan(6);
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = scoreSingleCriterion('', 'gherkin');
      expect(result.score).toBe(0);
      expect(result.grade).toBe('');
    });

    it('should handle whitespace only', () => {
      const result = scoreSingleCriterion('   \n  ', 'gherkin');
      expect(result.score).toBe(0);
    });

    it('should handle very long criteria with specificity penalty', () => {
      const longText = 'Given ' + 'word '.repeat(60) + 'When something Then result';
      const result = scoreSingleCriterion(longText, 'gherkin');
      expect(result.feedback).toContain('concise');
    });

    it('should detect vague terms in otherwise good criteria', () => {
      const result = scoreSingleCriterion(
        'Given the user is kind of ready\nWhen they click\nThen the page appears',
        'gherkin'
      );
      expect(result.feedback).toContain('vague');
    });
  });

  // Realistic BA Examples
  describe('Realistic Business Analyst Examples', () => {
    it('should score well for API response criteria', () => {
      const result = scoreSingleCriterion(
        'Given a valid authentication token\nWhen the API endpoint is called\nThen the system returns a 200 response with the user profile data',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toMatch(/Excellent|Good/);
    });

    it('should score well for UI interaction criteria', () => {
      const result = scoreSingleCriterion(
        'The user can click the "Add to Cart" button and see the cart icon update with the new item count',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toBe('Excellent');
    });

    it('should score well for validation criteria', () => {
      const result = scoreSingleCriterion(
        'Given the email field is empty\nWhen the user clicks submit\nThen an error message displays below the email field stating "Email is required"',
        'gherkin'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toMatch(/Excellent|Good/);
    });

    it('should score well for accessibility criteria', () => {
      const result = scoreSingleCriterion(
        'The system displays error messages with ARIA labels and moves keyboard focus to the first invalid field',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(11);
      expect(result.grade).toBe('Excellent');
    });

    it('should provide guidance for vague criteria', () => {
      const result = scoreSingleCriterion(
        'The system should probably handle errors correctly',
        'bullet'
      );
      expect(result.score).toBeLessThan(8);
      expect(result.feedback.length).toBeGreaterThan(0);
    });
  });

  // Feedback Quality
  describe('Feedback Quality', () => {
    it('should provide helpful feedback for incomplete Gherkin', () => {
      const result = scoreSingleCriterion(
        'When the button is clicked',
        'gherkin'
      );
      expect(result.feedback).toBeDefined();
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for missing observable outcomes', () => {
      const result = scoreSingleCriterion(
        'Given a user\nWhen they login\nThen success',
        'gherkin'
      );
      expect(result.feedback).toContain('observable');
    });

    it('should not provide feedback for excellent criteria', () => {
      const result = scoreSingleCriterion(
        'Given the user is on the home page\nWhen they click the search button\nThen the system displays the search results page',
        'gherkin'
      );
      expect(result.feedback).toBe('');
    });

    it('should provide multiple improvement suggestions when needed', () => {
      const result = scoreSingleCriterion(
        'Maybe works',
        'gherkin'
      );
      expect(result.feedback.split('•').length).toBeGreaterThan(1);
    });
  });

  // Format Comparison
  describe('Format Comparison', () => {
    it('should score Gherkin and Bullet differently for same intent', () => {
      const gherkin = scoreSingleCriterion(
        'Given a user\nWhen they click\nThen a message appears',
        'gherkin'
      );
      const bullet = scoreSingleCriterion(
        'The system displays a message when the user clicks',
        'bullet'
      );
      expect(gherkin.score).toBeGreaterThan(0);
      expect(bullet.score).toBeGreaterThan(0);
    });

    it('should penalize Gherkin format when bullet is expected', () => {
      const result = scoreSingleCriterion(
        'Given something When something Then something',
        'bullet'
      );
      expect(result.feedback).toContain('system');
    });

    it('should reward proper bullet format', () => {
      const result = scoreSingleCriterion(
        'System must validate all input fields before submission',
        'bullet'
      );
      expect(result.score).toBeGreaterThanOrEqual(8);
    });
  });
});
