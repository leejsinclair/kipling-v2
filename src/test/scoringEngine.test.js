import { describe, it, expect } from 'vitest';
import { scoreStory, calculateProgression, checkAchievements } from '../scoringEngine';

describe('scoreStory', () => {
  it('should give full completeness score for all fields filled', () => {
    const story = {
      asA: 'developer',
      iWant: 'to write clean code',
      soThat: 'I can maintain the codebase easily'
    };
    
    const result = scoreStory(story);
    expect(result.breakdown.completeness).toBe(10);
  });

  it('should give 0 completeness score when fields are missing', () => {
    const story = {
      asA: 'developer',
      iWant: '',
      soThat: 'I can maintain the codebase easily'
    };
    
    const result = scoreStory(story);
    expect(result.breakdown.completeness).toBe(0);
  });

  it('should score length appropriately for ideal word count', () => {
    const story = {
      asA: 'product manager',
      iWant: 'to export user stories as CSV',
      soThat: 'I can share them with my team in our backlog management tool'
    };
    
    const result = scoreStory(story);
    expect(result.wordCount).toBeGreaterThanOrEqual(18);
    expect(result.wordCount).toBeLessThanOrEqual(40);
    expect(result.breakdown.length).toBe(10);
  });

  it('should penalize very short stories', () => {
    const story = {
      asA: 'user',
      iWant: 'feature',
      soThat: 'value'
    };
    
    const result = scoreStory(story);
    expect(result.breakdown.length).toBeLessThan(6);
  });

  it('should detect and penalize filler words', () => {
    const story = {
      asA: 'developer',
      iWant: 'to basically write some kind of code',
      soThat: 'it is really just very good stuff'
    };
    
    const result = scoreStory(story);
    expect(result.breakdown.clarity).toBeLessThan(10);
  });

  it('should reward value-oriented phrases in "so that"', () => {
    const story = {
      asA: 'developer',
      iWant: 'to automate deployments',
      soThat: 'I can increase deployment frequency and reduce manual errors'
    };
    
    const result = scoreStory(story);
    expect(result.breakdown.soThatQuality).toBeGreaterThan(10);
  });

  it('should reward UK/AU value-oriented spellings in "so that"', () => {
    const story = {
      asA: 'operations manager',
      iWant: 'to improve deployment workflows',
      soThat: 'I can optimise release cadence and minimise manual effort'
    };

    const result = scoreStory(story);
    expect(result.breakdown.soThatQuality).toBeGreaterThan(10);
  });

  it('should return feedback and suggestions', () => {
    const story = {
      asA: 'user',
      iWant: 'to use app',
      soThat: 'it is better'
    };
    
    const result = scoreStory(story);
    expect(result.feedback).toBeDefined();
    expect(Array.isArray(result.feedback)).toBe(true);
    expect(result.suggestions).toBeDefined();
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('should not suggest adding action verbs when "so that" already includes one', () => {
    const story = {
      asA: 'house builder',
      iWant: 'to build a strong house',
      soThat: 'we can increase happiness'
    };

    const result = scoreStory(story);
    expect(result.suggestions).not.toContain("Try starting your 'So that' with an action verb like 'increase', 'reduce', or 'enable'");
  });

  it('should calculate total score correctly', () => {
    const story = {
      asA: 'developer',
      iWant: 'to write tests',
      soThat: 'I can ensure code quality and reduce bugs'
    };
    
    const result = scoreStory(story);
    const expectedTotal = 
      result.breakdown.completeness + 
      result.breakdown.length + 
      result.breakdown.clarity + 
      result.breakdown.soThatQuality + 
      result.breakdown.creativity;
    
    expect(result.totalScore).toBe(expectedTotal);
  });
});

describe('calculateProgression', () => {
  it('should start at Novice level with 0 XP', () => {
    const { currentLevel, nextLevel } = calculateProgression(0);
    expect(currentLevel.name).toBe('Novice');
    expect(nextLevel.name).toBe('Apprentice');
  });

  it('should reach Apprentice at 500 XP', () => {
    const { currentLevel, nextLevel } = calculateProgression(500);
    expect(currentLevel.name).toBe('Apprentice');
    expect(nextLevel.name).toBe('Writer');
  });

  it('should reach Writer at 1500 XP', () => {
    const { currentLevel } = calculateProgression(1500);
    expect(currentLevel.name).toBe('Writer');
  });

  it('should reach Storyteller at 3500 XP', () => {
    const { currentLevel } = calculateProgression(3500);
    expect(currentLevel.name).toBe('Storyteller');
  });

  it('should reach Product Visionary at 30000 XP', () => {
    const { currentLevel, nextLevel } = calculateProgression(30000);
    expect(currentLevel.name).toBe('Product Visionary');
    expect(nextLevel.name).toBe('Roadmap Oracle');
  });

  it('should reach Product Sage at 50000 XP', () => {
    const { currentLevel, nextLevel } = calculateProgression(50000);
    expect(currentLevel.name).toBe('Product Sage');
    expect(nextLevel).toBeNull();
  });

  it('should stay at Product Sage beyond 50000 XP', () => {
    const { currentLevel, nextLevel } = calculateProgression(75000);
    expect(currentLevel.name).toBe('Product Sage');
    expect(nextLevel).toBeNull();
  });
});

describe('checkAchievements', () => {
  it('should award Crystal Clear Value for 50+ points', () => {
    const achievements = checkAchievements(50, 25, []);
    const hasCrystalClear = achievements.some(a => a.id === 'crystal-clear');
    expect(hasCrystalClear).toBe(true);
  });

  it('should award Epic Writer for 55+ points', () => {
    const achievements = checkAchievements(55, 30, []);
    const hasEpicWriter = achievements.some(a => a.id === 'epic-writer');
    expect(hasEpicWriter).toBe(true);
  });

  it('should award Concise Master for high score with 20 or fewer words', () => {
    const achievements = checkAchievements(45, 18, []);
    const hasConciseMaster = achievements.some(a => a.id === 'concise-master');
    expect(hasConciseMaster).toBe(true);
  });

  it('should not award Concise Master if word count is too high', () => {
    const achievements = checkAchievements(45, 25, []);
    const hasConciseMaster = achievements.some(a => a.id === 'concise-master');
    expect(hasConciseMaster).toBe(false);
  });

  it('should award On Fire for three consecutive 40+ scores', () => {
    const history = [
      { score: 42 },
      { score: 45 },
      { score: 43 }
    ];
    const achievements = checkAchievements(41, 20, history);
    const hasOnFire = achievements.some(a => a.id === 'on-fire');
    expect(hasOnFire).toBe(true);
  });

  it('should not award achievements for low scores', () => {
    const achievements = checkAchievements(30, 25, []);
    expect(achievements.length).toBe(0);
  });
});
