/**
 * AI Gating Tests
 *
 * Verifies that AI controls are disabled by default and only activate
 * after a valid key is provided via the AIAccessPanel.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Keep localStorage clean between tests
beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fillAndDraftScoreStory(user) {
  await user.type(screen.getByLabelText(/as a/i), 'product manager');
  await user.type(screen.getByLabelText(/i want/i), 'to export weekly incident summaries');
  await user.type(screen.getByLabelText(/so that/i), 'I can reduce weekly reporting time by 40%');
  await user.click(screen.getByRole('button', { name: /score draft story/i }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AI gating', () => {
  it('AI controls are disabled when no key is set', () => {
    render(<App />);

    // The "Enable AI" button should be present but the "Improve with AI" button
    // should not be interactive (disabled) before a draft score exists
    expect(screen.getByRole('button', { name: /enable ai/i })).toBeInTheDocument();
    // No "Improve with AI" button visible yet (no draft scored)
    expect(screen.queryByRole('button', { name: /improve with ai/i })).not.toBeInTheDocument();
  });

  it('Improve with AI button is disabled (visually) when no key and draft exists', async () => {
    const user = userEvent.setup();
    render(<App />);

    await fillAndDraftScoreStory(user);

    // The disabled variant of the button should appear
    const improveBtn = screen.getByRole('button', { name: /improve with ai/i });
    expect(improveBtn).toBeDisabled();
  });

  it('AI enables after entering test-key and clicking Enable AI', async () => {
    const user = userEvent.setup();
    render(<App />);

    const keyInput = screen.getByLabelText(/openai api key/i);
    await user.type(keyInput, 'test-key');
    await user.click(screen.getByRole('button', { name: /enable ai/i }));

    await waitFor(() => {
      expect(screen.getByText(/enabled – session only/i)).toBeInTheDocument();
    });
    // Disable button should now be present
    expect(screen.getByRole('button', { name: /disable ai/i })).toBeInTheDocument();
  });

  it('Improve with AI button is enabled after key validation and draft score', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Enable AI first
    await user.type(screen.getByLabelText(/openai api key/i), 'test-key');
    await user.click(screen.getByRole('button', { name: /enable ai/i }));
    await waitFor(() => screen.getByText(/enabled – session only/i));

    // Draft score a story
    await fillAndDraftScoreStory(user);

    // The active (not disabled) Improve with AI button should appear
    const improveBtn = screen.getByRole('button', { name: /improve with ai/i });
    expect(improveBtn).not.toBeDisabled();
  });

  it('shows validation error for an obviously invalid key', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/openai api key/i), 'bad-key');
    await user.click(screen.getByRole('button', { name: /enable ai/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.queryByText(/enabled – session only/i)).not.toBeInTheDocument();
  });

  it('clears key and disables AI immediately when Disable AI is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Enable AI
    await user.type(screen.getByLabelText(/openai api key/i), 'test-key');
    await user.click(screen.getByRole('button', { name: /enable ai/i }));
    await waitFor(() => screen.getByText(/enabled – session only/i));

    // Disable AI
    await user.click(screen.getByRole('button', { name: /disable ai/i }));

    expect(screen.queryByText(/enabled – session only/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable ai/i })).toBeInTheDocument();
  });

  it('remount starts with AI disabled and no key (simulates page refresh)', () => {
    const { unmount } = render(<App />);
    unmount();
    render(<App />);

    // After remount: AI panel shows disabled state, no key present
    expect(screen.queryByText(/enabled – session only/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enable ai/i })).toBeInTheDocument();
  });

  it('AI key is not persisted to localStorage', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/openai api key/i), 'test-key');
    await user.click(screen.getByRole('button', { name: /enable ai/i }));
    await waitFor(() => screen.getByText(/enabled – session only/i));

    // Check all known localStorage keys – none should contain the API key
    const storedKeys = Object.keys(localStorage);
    for (const k of storedKeys) {
      expect(localStorage.getItem(k)).not.toContain('test-key');
    }
  });
});
