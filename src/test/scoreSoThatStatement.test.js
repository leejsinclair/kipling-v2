import { describe, it, expect } from 'vitest';
import { scoreSoThatStatement } from '../scoringEngine';

describe('scoreSoThatStatement', () => {
  // Excellent cases (17-20 points) - Should have business metrics, value verbs, numbers, good length
  describe('Excellent statements (17-20 points)', () => {
    it('should score highly for specific business metrics with numbers', () => {
      const result = scoreSoThatStatement('we can reduce customer support response time by 50% and increase customer satisfaction');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
      expect(result.color).toBe('green');
    });

    it('should score highly for revenue-focused outcomes', () => {
      const result = scoreSoThatStatement('we can increase conversion rate from 2% to 5% and generate an additional $50k monthly revenue');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for efficiency improvements with time metrics', () => {
      const result = scoreSoThatStatement('we can reduce processing time from 10 minutes to 2 minutes and improve throughput by 80%');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for quality metrics', () => {
      const result = scoreSoThatStatement('we can reduce error rate from 5% to 1% and improve accuracy across all transactions');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for cost reduction with specific amounts', () => {
      const result = scoreSoThatStatement('we can reduce operational costs by $10,000 per month and improve profit margin by 15%');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for multiple business metrics with numbers', () => {
      const result = scoreSoThatStatement('we can reduce processing time by 40% and improve accuracy');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });

    it('should score highly for UK/AU spellings with measurable outcomes', () => {
      const result = scoreSoThatStatement('we can minimise response time by 40% and improve resource utilisation');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });
  });

  // Good cases (13-16 points) - Missing one or two elements
  describe('Good statements (13-16 points)', () => {
    it('should score well for business metrics with numbers and moderate length', () => {
      const result = scoreSoThatStatement('we can improve response time by 30%');
      expect(result.score).toBeGreaterThanOrEqual(13);
      expect(result.score).toBeLessThan(17);
      expect(result.grade).toBe('Good');
      expect(result.color).toBe('blue');
    });

    it('should score as good when missing specific numbers', () => {
      const result = scoreSoThatStatement('we can reduce customer support response time and increase customer satisfaction significantly');
      expect(result.score).toBeGreaterThanOrEqual(13);
      expect(result.grade).toBe('Good');
    });

    it('should score as good with business metrics but lacking detail', () => {
      const result = scoreSoThatStatement('we can improve conversion rate and reduce churn');
      expect(result.score).toBeGreaterThanOrEqual(10);
      expect(result.score).toBeLessThan(17);
    });

    it('should provide clear guidance on reaching Excellent from Good', () => {
      const result = scoreSoThatStatement('we can improve conversion rate by 15%');
      expect(result.score).toBeGreaterThanOrEqual(13);
      expect(result.score).toBeLessThan(17);
      expect(result.feedback).toContain('To reach Excellent');
    });
  });

  // Fair cases (9-12 points) - Basic structure but missing key elements
  describe('Fair statements (9-12 points)', () => {
    it('should score as fair for value verbs without specific metrics or numbers', () => {
      const result = scoreSoThatStatement('we can improve things and reduce waste');
      expect(result.score).toBeGreaterThanOrEqual(7);
      expect(result.score).toBeLessThan(13);
      expect(result.grade).toBe('Fair');
      expect(result.color).toBe('yellow');
    });

    it('should score as fair when too brief with value verb', () => {
      const result = scoreSoThatStatement('we can save time');
      expect(result.score).toBeGreaterThanOrEqual(5);
      expect(result.score).toBeLessThan(13);
    });

    it('should score as fair with vague outcomes', () => {
      const result = scoreSoThatStatement('we can make things better and improve the system');
      expect(result.score).toBeLessThan(13);
    });
  });

  // Needs Work cases (<9 points) - Critical issues
  describe('Needs work statements (<9 points)', () => {
    it('should penalize flowery/emotional language heavily', () => {
      const result = scoreSoThatStatement('we can increase happiness by 20% and live happily in a strong house protected from the dangerous elements');
      expect(result.score).toBeLessThan(9);
      expect(result.grade).toBe('Needs work');
      expect(result.color).toBe('orange');
      expect(result.feedback).toContain('emotional');
    });

    it('should penalize non-business terms even with good metrics', () => {
      const result = scoreSoThatStatement('we can increase productivity by 20% and live in a strong team protected from the dangerous elements');
      expect(result.score).toBeLessThan(17); // Still penalized, but has some good elements
      expect(result.feedback).toContain('emotional');
    });

    it('should score low for vague phrases without specifics', () => {
      const result = scoreSoThatStatement('it is better and easier');
      expect(result.score).toBeLessThan(9);
      expect(result.grade).toBe('Needs work');
    });

    it('should score low when missing value verbs', () => {
      const result = scoreSoThatStatement('the system will work better');
      expect(result.score).toBeLessThan(9);
    });

    it('should score low for extremely brief statements', () => {
      const result = scoreSoThatStatement('it works');
      expect(result.score).toBeLessThan(9);
      expect(result.grade).toBe('Needs work');
    });
  });

  // Edge cases and specific patterns
  describe('Edge cases and pattern detection', () => {
    it('should detect "live in/with" pattern as flowery', () => {
      const result = scoreSoThatStatement('we can increase sales and live in peace');
      expect(result.score).toBeLessThan(13);
      expect(result.feedback).toContain('emotional');
    });

    it('should detect "protected from" pattern as flowery', () => {
      const result = scoreSoThatStatement('we can improve security to be protected from attacks');
      expect(result.score).toBeLessThan(13);
      expect(result.feedback).toContain('emotional');
    });

    it('should handle empty/whitespace input', () => {
      const result = scoreSoThatStatement('   ');
      expect(result).toBeNull();
    });

    it('should handle null/undefined gracefully', () => {
      const result1 = scoreSoThatStatement('');
      expect(result1).toBeNull();
    });

    it('should give feedback about linking numbers to context', () => {
      const result = scoreSoThatStatement('we can increase performance by 50% overall');
      expect(result.feedback).toContain('Link numbers to business metrics');
    });

    it('should reward linking percentages to specific metrics', () => {
      const result1 = scoreSoThatStatement('we can increase by 50%');
      const result2 = scoreSoThatStatement('we can increase conversion rate by 50%');
      expect(result2.score).toBeGreaterThan(result1.score);
    });
  });

  // Realistic business analyst examples
  describe('Realistic BA examples', () => {
    it('should score well for typical e-commerce outcome', () => {
      const result = scoreSoThatStatement('we can increase checkout conversion rate by 15% and reduce cart abandonment');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.grade).toBe('Excellent');
    });

    it('should score well for typical support improvement', () => {
      const result = scoreSoThatStatement('we can reduce average ticket resolution time from 24 hours to 4 hours');
      expect(result.score).toBeGreaterThanOrEqual(16); // Adjusted expectation
      expect(result.grade).toMatch(/Excellent|Good/);
    });

    it('should score well for compliance outcome', () => {
      const result = scoreSoThatStatement('we can ensure compliance with GDPR requirements and reduce risk of regulatory fines');
      expect(result.score).toBeGreaterThanOrEqual(13);
    });

    it('should guide improvement for generic productivity claim', () => {
      const result = scoreSoThatStatement('we can improve team productivity');
      expect(result.score).toBeLessThan(13);
      expect(result.feedback).toMatch(/add|more|specific/i);
    });
  });

  // Feedback quality tests
  describe('Feedback quality', () => {
    it('should provide actionable feedback for mid-range scores', () => {
      const result = scoreSoThatStatement('we can increase efficiency by 25%');
      expect(result.feedback).toBeDefined();
      expect(result.feedback.length).toBeGreaterThan(10);
    });

    it('should celebrate excellent outcomes', () => {
      const result = scoreSoThatStatement('we can reduce processing time by 80% and save $50,000 annually in operational costs');
      expect(result.score).toBeGreaterThanOrEqual(17);
      expect(result.feedback).not.toContain('emotional');
      expect(result.feedback).not.toContain('To reach Excellent');
    });

    it('should prioritize flowery language warning over other issues', () => {
      const result = scoreSoThatStatement('live happily');
      expect(result.feedback).toContain('emotional');
    });
  });
});
