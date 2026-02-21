import { describe, it, expect } from 'vitest';
import { scoreStory } from '../scoringEngine';
import { scoreCriteria } from '../criteriaScoring';

describe('scoring system range checks', () => {
  it('should score stories in an expected low-to-high progression', () => {
    const stories = [
      {
        name: 'low',
        story: {
          asA: 'user',
          iWant: 'feature',
          soThat: 'better'
        },
        min: 15,
        max: 40
      },
      {
        name: 'medium',
        story: {
          asA: 'customer support agent',
          iWant: 'to view ticket history quickly',
          soThat: 'I can respond to customers faster'
        },
        min: 30,
        max: 48
      },
      {
        name: 'high',
        story: {
          asA: 'operations manager',
          iWant: 'to automate nightly backup reports',
          soThat: 'I can reduce manual effort by 30% and increase delivery reliability for the team'
        },
        min: 45,
        max: 55
      }
    ];

    const scores = stories.map(({ story, min, max, name }) => {
      const result = scoreStory(story);
      expect(result.totalScore, `${name} story score should be within expected range`).toBeGreaterThanOrEqual(min);
      expect(result.totalScore, `${name} story score should be within expected range`).toBeLessThanOrEqual(max);
      return result.totalScore;
    });

    expect(scores[1]).toBeGreaterThan(scores[0]);
    expect(scores[2]).toBeGreaterThan(scores[1]);
  });

  it('should score acceptance criteria in an expected low-to-high progression', () => {
    const storyValue = 'I can reduce manual effort and improve reliability';

    const criteriaSets = [
      {
        name: 'low',
        criteria: ['it should work', 'maybe shows a thing'],
        format: 'bullet',
        min: 10,
        max: 35
      },
      {
        name: 'medium',
        criteria: [
          'The system must validate email input',
          'The user can export data as CSV',
          'The page displays an error message for invalid fields'
        ],
        format: 'bullet',
        min: 30,
        max: 50
      },
      {
        name: 'high',
        criteria: [
          'Given I am logged in as an admin',
          'When I click export on the reports page',
          'Then the system displays a success message and downloads the CSV file'
        ],
        format: 'gherkin',
        min: 35,
        max: 55
      }
    ];

    const scores = criteriaSets.map(({ criteria, format, min, max, name }) => {
      const result = scoreCriteria(criteria, storyValue, format);
      expect(result.totalScore, `${name} criteria score should be within expected range`).toBeGreaterThanOrEqual(min);
      expect(result.totalScore, `${name} criteria score should be within expected range`).toBeLessThanOrEqual(max);
      return result.totalScore;
    });

    expect(scores[1]).toBeGreaterThan(scores[0]);
    expect(scores[2]).toBeGreaterThan(scores[1]);
  });
});
