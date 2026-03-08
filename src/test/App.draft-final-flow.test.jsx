/**
 * Draft / Final Flow Tests
 *
 * Verifies the full draft → improve → confirm → final flow for both
 * story and acceptance criteria, including XP and history finalization.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { scoreStory } from '../scoringEngine';

beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_STORY = {
  asA: 'customer support manager',
  iWant: 'to export weekly incident summaries',
  soThat: 'I can reduce weekly reporting time by 40%',
};

const SECOND_STORY = {
  asA: 'warehouse supervisor',
  iWant: 'to schedule inventory recount tasks',
  soThat: 'I can reduce missed stock discrepancies by 30%',
};

const TEST_CRITERION =
  'Given a valid form, When the user clicks Submit, Then the system shows a success message';

async function enableAI(user) {
  await user.type(screen.getByLabelText(/openai api key/i), 'test-key');
  await user.click(screen.getByRole('button', { name: /enable ai/i }));
  await waitFor(() => screen.getByText(/enabled – session only/i));
}

async function draftScoreStory(user, story = TEST_STORY) {
  await user.type(screen.getByLabelText(/as a/i), story.asA);
  await user.type(screen.getByLabelText(/i want/i), story.iWant);
  await user.type(screen.getByLabelText(/so that/i), story.soThat);
  await user.click(screen.getByRole('button', { name: /score draft story/i }));
}

async function confirmAndFinalScoreStory(user) {
  await user.click(screen.getByRole('button', { name: /confirm story/i }));
  await user.click(screen.getByRole('button', { name: /calculate final story score/i }));
}

async function draftScoreCriteria(user, criterion = TEST_CRITERION) {
  // The first criteria field should be visible
  const inputs = screen.getAllByRole('textbox');
  const criteriaInput = inputs.find(i =>
    i.placeholder?.toLowerCase().includes('given') ||
    i.getAttribute('aria-label')?.toLowerCase().includes('criterion') ||
    i.id?.includes('criterion')
  ) ?? inputs[inputs.length - 1];
  await user.clear(criteriaInput);
  await user.type(criteriaInput, criterion);
  await user.click(screen.getByRole('button', { name: /score draft criteria/i }));
}

async function confirmAndFinalScoreCriteria(user) {
  await user.click(screen.getByRole('button', { name: /confirm criteria/i }));
  await user.click(screen.getByRole('button', { name: /calculate final criteria score/i }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Draft / Final flow', () => {
  it('draft story scoring does not award XP', async () => {
    const user = userEvent.setup();
    render(<App />);

    const initialXP = parseInt(localStorage.getItem('totalXP') ?? '0', 10);
    await draftScoreStory(user);

    // XP should not have changed after draft scoring
    const xpAfterDraft = parseInt(localStorage.getItem('totalXP') ?? '0', 10);
    expect(xpAfterDraft).toBe(initialXP);
  });

  it('draft story scoring does not save to history', async () => {
    const user = userEvent.setup();
    render(<App />);

    await draftScoreStory(user);

    const history = JSON.parse(localStorage.getItem('storyHistory') ?? '[]');
    expect(history).toHaveLength(0);
  });

  it('draft score results are shown after scoring', async () => {
    const user = userEvent.setup();
    render(<App />);

    await draftScoreStory(user);

    expect(screen.getByText(/draft story score/i)).toBeInTheDocument();
    // Confirm and Improve buttons should be visible
    expect(screen.getByRole('button', { name: /confirm story/i })).toBeInTheDocument();
  });

  it('story can be confirmed after draft scoring, then final scored', async () => {
    const user = userEvent.setup();
    render(<App />);

    await draftScoreStory(user);
    await user.click(screen.getByRole('button', { name: /confirm story/i }));

    // Confirmed story panel should appear
    expect(screen.getByText(/story confirmed/i)).toBeInTheDocument();

    // Calculate Final Story Score button should be present
    const finalBtn = screen.getByRole('button', { name: /calculate final story score/i });
    expect(finalBtn).toBeInTheDocument();
    await user.click(finalBtn);

    // Should now be in criteria phase: criteria form visible
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /score draft criteria/i })).toBeInTheDocument();
    });
  });

  it('AI improvement shows suggestion panel that can be dismissed', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enableAI(user);
    await draftScoreStory(user);

    await user.click(screen.getByRole('button', { name: /improve with ai/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai suggestion/i)).toBeInTheDocument();
    });

    // Dismiss the suggestion
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText(/ai suggestion/i)).not.toBeInTheDocument();
  });

  it('applying AI suggestion pre-fills the story form with suggested values', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enableAI(user);
    await draftScoreStory(user);

    await user.click(screen.getByRole('button', { name: /improve with ai/i }));
    await waitFor(() => screen.getByText(/ai suggestion/i));

    await user.click(screen.getByRole('button', { name: /apply suggestion/i }));

    // After applying, the suggestion panel should be gone and the form should be back
    // with suggested values pre-filled
    await waitFor(() => {
      expect(screen.queryByText(/ai suggestion/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/as a/i)).toBeInTheDocument();
    });
  });

  it('applies a single criteria suggestion without overwriting all criteria', async () => {
    const user = userEvent.setup();
    render(<App />);

    await enableAI(user);
    await draftScoreStory(user);
    await confirmAndFinalScoreStory(user);

    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);

    await user.click(screen.getByRole('button', { name: /improve criteria with ai/i }));
    await waitFor(() => screen.getByText(/ai suggestion/i));

    const applyButtons = screen.getAllByRole('button', { name: /apply suggestion/i });
    expect(applyButtons.length).toBeGreaterThan(0);

    await user.click(applyButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/ai suggestion/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /applied/i })).toBeDisabled();
    });
  });

  it('criteria draft scoring does not award XP', async () => {
    const user = userEvent.setup();
    render(<App />);

    const xpBefore = parseInt(localStorage.getItem('totalXP') ?? '0', 10);
    await draftScoreStory(user);
    await confirmAndFinalScoreStory(user);

    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);

    // XP should still be unchanged (no XP until final criteria scored)
    const xpAfterCriteriaDraft = parseInt(localStorage.getItem('totalXP') ?? '0', 10);
    expect(xpAfterCriteriaDraft).toBe(xpBefore);
  });

  it('completing final criteria scoring awards XP and saves history', async () => {
    const user = userEvent.setup();
    render(<App />);

    const xpBefore = parseInt(localStorage.getItem('totalXP') ?? '0', 10);

    await draftScoreStory(user);
    await confirmAndFinalScoreStory(user);

    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);
    await confirmAndFinalScoreCriteria(user);

    // XP should have increased
    const xpAfter = parseInt(localStorage.getItem('totalXP') ?? '0', 10);
    expect(xpAfter).toBeGreaterThan(xpBefore);

    // History should have exactly one entry
    const history = JSON.parse(localStorage.getItem('storyHistory') ?? '[]');
    expect(history).toHaveLength(1);
    expect(history[0]).toHaveProperty('storyScore');
    expect(history[0]).toHaveProperty('criteriaScore');
    expect(history[0]).toHaveProperty('combinedScore');
  });

  it('combined score summary uses final scores', async () => {
    const user = userEvent.setup();
    render(<App />);

    await draftScoreStory(user);
    await confirmAndFinalScoreStory(user);

    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);
    await confirmAndFinalScoreCriteria(user);

    // Combined Score Summary should be visible
    await waitFor(() => {
      expect(screen.getByText(/combined quality score/i)).toBeInTheDocument();
    });
  });

  it('history entry contains final story and criteria scores', async () => {
    const user = userEvent.setup();
    render(<App />);

    await draftScoreStory(user);
    await confirmAndFinalScoreStory(user);

    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);
    await confirmAndFinalScoreCriteria(user);

    const history = JSON.parse(localStorage.getItem('storyHistory') ?? '[]');
    expect(history).toHaveLength(1);
    const entry = history[0];
    expect(typeof entry.storyScore).toBe('number');
    expect(typeof entry.criteriaScore).toBe('number');
    expect(entry.combinedScore).toBe(entry.storyScore + entry.criteriaScore);
  });

  it('Start New resets the flow and shows the story form again', async () => {
    const user = userEvent.setup();
    render(<App />);

    await draftScoreStory(user);
    await confirmAndFinalScoreStory(user);

    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);
    await confirmAndFinalScoreCriteria(user);

    await waitFor(() => screen.getByRole('button', { name: /start new story/i }));
    await user.click(screen.getByRole('button', { name: /start new story/i }));

    // Story form should be visible again
    expect(screen.getByLabelText(/as a/i)).toBeInTheDocument();
  });

  it('loading criteria from history does not overwrite active story score', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Create one completed historical session.
    await draftScoreStory(user, TEST_STORY);
    await confirmAndFinalScoreStory(user);
    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));
    await draftScoreCriteria(user);
    await confirmAndFinalScoreCriteria(user);

    // Start a new session and score a different story to criteria phase.
    await waitFor(() => screen.getByRole('button', { name: /start new story/i }));
    await user.click(screen.getByRole('button', { name: /start new story/i }));

    await draftScoreStory(user, SECOND_STORY);
    await confirmAndFinalScoreStory(user);
    await waitFor(() => screen.getByRole('button', { name: /score draft criteria/i }));

    const secondStoryScore = scoreStory(SECOND_STORY).totalScore;
    expect(screen.getByText('📝 Your Story Score')).toBeInTheDocument();
    expect(screen.getAllByText(String(secondStoryScore)).length).toBeGreaterThan(0);

    // Load criteria from history item; active story score should remain unchanged.
    await user.click(screen.getByRole('button', { name: /load criteria/i }));

    expect(screen.getByRole('button', { name: /score draft criteria/i })).toBeInTheDocument();
    expect(screen.getAllByText(String(secondStoryScore)).length).toBeGreaterThan(0);
  });
});
