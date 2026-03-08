/**
 * Deterministic mock LLM responses for use in tests.
 * These fixtures are returned by llmService when apiKey === 'test-key'.
 */

export const mockStoryImproveResponse = {
  issues: [
    'Persona is too generic',
    'Value statement is not measurable',
  ],
  suggestion: {
    asA: 'customer support manager',
    iWant: 'to export weekly incident summaries',
    soThat: 'I can reduce weekly reporting time by 40%',
  },
  rationale: [
    { criterion: 'completeness', reason: 'Persona is now specific to a role' },
    { criterion: 'soThatQuality', reason: 'Outcome is measurable with a concrete percentage' },
  ],
};

export const mockCriteriaImproveResponse = {
  suggestions: [
    {
      original: 'Given user click submit then success',
      improved:
        'Given a valid form, When the user clicks Submit, Then the system shows a success message',
    },
  ],
  guidance: [
    'Use complete Given/When/Then structure',
    'Make outcomes observable and testable',
  ],
};
