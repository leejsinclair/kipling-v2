import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  improveStoryWithAI,
  improveCriteriaWithAI,
} from '../llmService';

function makeChatResponse(content) {
  return {
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content,
          },
        },
      ],
    }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('llmService payload hardening', () => {
  it('includes story context in criteria improvement prompt payload', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            suggestions: [
              {
                original:
                  'Given a valid form is completed by the user\nWhen the user clicks Submit\nThen the system shows a success message',
                improved:
                  'Given a valid form is completed by the user, When the user clicks Submit, Then the system shows a success message and records an audit event.',
              },
            ],
            guidance: [
              'Tie each criterion to the story value outcome.',
              'Use observable status and audit evidence in Then statements.',
            ],
          }),
        ),
      );

    await improveCriteriaWithAI({
      criteria: [
        'Given a valid form is completed by the user\nWhen the user clicks Submit\nThen the system shows a success message',
      ],
      format: 'gherkin',
      draftScore: 41,
      breakdown: { format: 10, testability: 9, specificity: 7, alignment: 5, completeness: 10 },
      hintTargets: [
        'Use observable outcomes in Then steps.',
        'Reuse key story value terms for alignment.',
      ],
      story: {
        asA: 'approver',
        iWant: 'to review purchase requests quickly',
        soThat: 'I can reduce approval lead time by 30%',
      },
      apiKey: 'sk-test-not-real',
    });

    const [, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    const userPrompt = body.messages.find(m => m.role === 'user')?.content || '';

    expect(userPrompt).toContain('Story context (for alignment):');
    expect(userPrompt).toContain('As a: approver');
    expect(userPrompt).toContain('I want: to review purchase requests quickly');
    expect(userPrompt).toContain('So that: I can reduce approval lead time by 30%');
    expect(userPrompt).toContain('Additional scoring hints from local engine:');
    expect(userPrompt).toContain('Use observable outcomes in Then steps.');
  });

  it('retries story suggestion when first response contains placeholders', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            issues: ['<issue1>', 'Needs clarity'],
            suggestion: {
              asA: '<improved persona>',
              iWant: 'to improve things',
              soThat: '<improved outcome>',
            },
            rationale: [{ criterion: 'clarity', reason: '<why this improves the score>' }],
          }),
        ),
      )
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            issues: ['Persona is too generic', 'Outcome is not measurable'],
            suggestion: {
              asA: 'customer support manager',
              iWant: 'to export weekly incident summaries',
              soThat: 'I can reduce weekly reporting time by 40%',
            },
            rationale: [{ criterion: 'soThatQuality', reason: 'Outcome includes a measurable target' }],
          }),
        ),
      );

    const result = await improveStoryWithAI({
      story: {
        asA: 'user',
        iWant: 'to export incident summaries',
        soThat: 'I can work faster',
      },
      draftScore: 39,
      breakdown: { completeness: 10, length: 6, clarity: 10, soThatQuality: 8, creativity: 5 },
      apiKey: 'sk-test-not-real',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.issues[0]).toBe('Persona is too generic');
    expect(result.suggestion.asA).toBe('customer support manager');
  });

  it('returns safe story fallback if both attempts are invalid', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(makeChatResponse('{"issues":["<issue1>"]}'))
      .mockResolvedValueOnce(makeChatResponse('{"issues":["<issue2>"]}'));

    const result = await improveStoryWithAI({
      story: {
        asA: 'house builder',
        iWant: 'to create a strong house',
        soThat: 'we can increase website speed by 20%',
      },
      draftScore: 39,
      breakdown: { completeness: 10, length: 6, clarity: 10, soThatQuality: 8, creativity: 5 },
      apiKey: 'sk-test-not-real',
    });

    expect(result).toHaveProperty('issues');
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.suggestion).toHaveProperty('asA');
    expect(result.suggestion.asA).not.toContain('<');
  });

  it('retries criteria suggestion when first response uses template tokens', async () => {
    const criteriaInput = [
      'Given a valid form is completed by the user\nWhen the user clicks Submit\nThen the system shows a success message',
    ];

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            suggestions: [{ original: '<criterion1>', improved: '<improved criterion>' }],
            guidance: ['<tip1>', '<tip2>'],
          }),
        ),
      )
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            suggestions: [
              {
                original: criteriaInput[0],
                improved:
                  'Given a valid form and required fields are completed, When the user clicks Submit, Then the system shows a success message and stores an audit record with timestamp.',
              },
            ],
            guidance: ['Use full Given/When/Then structure', 'Make outcomes observable and testable'],
          }),
        ),
      );

    const result = await improveCriteriaWithAI({
      criteria: criteriaInput,
      format: 'gherkin',
      draftScore: 31,
      breakdown: { format: 5, testability: 8, specificity: 6, alignment: 6, completeness: 6 },
      apiKey: 'sk-test-not-real',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.suggestions[0].improved).toContain('audit record with timestamp');
  });

  it('retries criteria suggestion when first response is Then-only fragments', async () => {
    const criteriaInput = [
      'Given an employee submits a purchase request over $5,000\nWhen the workflow engine processes the request\nThen the system routes the approval task to the manager delegate',
      'Given an approver views a pending request\nWhen they click Reject and provide a reason\nThen the system updates the request status to Rejected',
    ];

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            suggestions: [
              {
                original: 'Then the request status updates to Pending Approval - Delegated',
                improved: 'Then the system updates status and logs the event',
              },
            ],
            guidance: [
              'Use concrete triggers in the When step.',
              'Define observable outcomes in Then.',
            ],
          }),
        ),
      )
      .mockResolvedValueOnce(
        makeChatResponse(
          JSON.stringify({
            suggestions: [
              {
                original: criteriaInput[0],
                improved:
                  'Given an employee submits a purchase request over $5,000 and manager approval is required, When the workflow engine processes the request and detects the manager is out of office, Then the system routes approval to the configured delegate, updates status to Pending Approval - Delegated, and logs the delegation event with timestamp.',
              },
            ],
            guidance: [
              'Keep full Given/When/Then structure in each improved criterion.',
              'Include observable outcomes such as status change, notification, and audit evidence.',
            ],
          }),
        ),
      );

    const result = await improveCriteriaWithAI({
      criteria: criteriaInput,
      format: 'gherkin',
      draftScore: 41,
      breakdown: { format: 10, testability: 9, specificity: 7, alignment: 5, completeness: 10 },
      apiKey: 'sk-test-not-real',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.suggestions[0].improved).toContain('Given');
    expect(result.suggestions[0].improved).toContain('When');
    expect(result.suggestions[0].improved).toContain('Then');
  });

  it('keeps non-regressive criteria suggestions even when uplift is minimal', async () => {
    const criteriaInput = [
      'Given a valid form is completed by the user\nWhen the user clicks Submit\nThen the system shows a success message',
    ];

    const nonImprovingPayload = JSON.stringify({
      suggestions: [
        {
          original: criteriaInput[0],
          improved: criteriaInput[0],
        },
      ],
      guidance: [
        'Keep format unchanged.',
        'No additional details needed.',
      ],
    });

    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(makeChatResponse(nonImprovingPayload));

    const result = await improveCriteriaWithAI({
      criteria: criteriaInput,
      format: 'gherkin',
      draftScore: 8,
      breakdown: { format: 5, testability: 2, specificity: 1, alignment: 0, completeness: 5 },
      story: {
        asA: 'ops manager',
        iWant: 'to process requests faster',
        soThat: 'I can reduce manual rework by 20%',
      },
      apiKey: 'sk-test-not-real',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.suggestions[0].improved).toBe(criteriaInput[0]);
  });

  it('keeps valid criteria suggestions when one suggestion in payload is invalid', async () => {
    const criteriaInput = [
      'Given an employee submits a purchase request over $5,000\nWhen the workflow engine processes the request\nThen the system routes the approval task to the manager delegate',
      'Given an approver views a pending request\nWhen they click Reject and provide a reason\nThen the system updates the request status to Rejected',
      'Given all required approvers have approved a request\nWhen the final approval is submitted\nThen the system marks the request status as Approved',
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeChatResponse(
        JSON.stringify({
          suggestions: [
            {
              original: criteriaInput[0],
              improved:
                'Given an employee submits a purchase request over $5,000 and manager approval is required, When the workflow engine processes the request and detects the manager is out of office, Then the system routes approval to the configured delegate, updates status to Pending Approval - Delegated, and logs the delegation event with timestamp.',
            },
            {
              original: criteriaInput[1],
              improved: 'Then the system updates the request status to Rejected',
            },
            {
              original: criteriaInput[2],
              improved:
                'Given all required approvers have approved a request, When the final approval is submitted by an authorized approver, Then the system marks the request status as Approved and records the approval chain with timestamps in the audit log.',
            },
          ],
          guidance: [
            'Use full Given/When/Then structure in each improved criterion.',
            'Include observable outcomes and audit evidence where relevant.',
          ],
        }),
      ),
    );

    const result = await improveCriteriaWithAI({
      criteria: criteriaInput,
      format: 'gherkin',
      draftScore: 41,
      breakdown: { format: 10, testability: 9, specificity: 7, alignment: 5, completeness: 10 },
      story: {
        asA: 'approver',
        iWant: 'to process requests reliably',
        soThat: 'I can reduce approval delays',
      },
      apiKey: 'sk-test-not-real',
    });

    expect(result.suggestions.length).toBe(2);
    expect(result.suggestions.some(s => s.original.includes('approver views a pending request'))).toBe(false);
  });

  it('keeps all three valid criteria suggestions from model output', async () => {
    const criteriaInput = [
      'Given an employee submits a purchase request over $5,000 requiring manager approval while their manager is out of office\nWhen the workflow engine processes the request\nThen the system identifies the manager\'s delegate, routes the approval task to them, and updates the request status to "Pending Approval - Delegated"',
      'Given an approver views a pending request\nWhen the approver clicks the "Reject" button and enters a rejection reason\nThen the system updates the request status to "Rejected", sends an email to the requester with the reason, and logs the rejection in the workflow history',
      'Given all required approvers have approved a request\nWhen the final approval is submitted by an authorized approver\nThen the system marks the request status as "Approved", triggers the payment processing workflow, and logs the approval chain in the audit log',
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      makeChatResponse(
        JSON.stringify({
          suggestions: [
            {
              original: criteriaInput[0],
              improved:
                'Given an employee submits a purchase request over $5,000 requiring manager approval while their manager is out of office, When the workflow engine processes the request, Then the system routes approval to the configured delegate, records delegation with timestamp, and shows status "Pending Approval - Delegated" in the request timeline.',
            },
            {
              original: criteriaInput[1],
              improved:
                'Given an approver views a pending request, When the approver clicks "Reject" and enters a rejection reason, Then the system sets status to "Rejected", sends a rejection email to the requester, and writes the reason and actor to workflow history with timestamp.',
            },
            {
              original: criteriaInput[2],
              improved:
                'Given all required approvers have approved a request, When the final approval is submitted by an authorized approver, Then the system sets status to "Approved", triggers payment processing, and logs the full approval chain with timestamps in the audit log.',
            },
          ],
          guidance: [
            'Keep full Given/When/Then in each criterion and include observable outcomes.',
            'Tie outcomes to status, notifications, and audit evidence where applicable.',
          ],
        }),
      ),
    );

    const result = await improveCriteriaWithAI({
      criteria: criteriaInput,
      format: 'gherkin',
      draftScore: 42,
      breakdown: { format: 10, testability: 7, specificity: 10, alignment: 5, completeness: 10 },
      story: {
        asA: 'construction project manager',
        iWant: 'to implement energy-efficient building materials',
        soThat: 'we can reduce energy costs by 30% annually',
      },
      apiKey: 'sk-test-not-real',
    });

    expect(result.suggestions.length).toBe(3);
  });
});
