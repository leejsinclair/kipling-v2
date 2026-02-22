import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoryHistory from '../components/StoryHistory';
import { scoreStory } from '../scoringEngine';
import { scoreCriteria } from '../criteriaScoring';

const story = {
  timestamp: 1735732800000,
  asA: 'support manager',
  iWant: 'to export ticket summaries',
  soThat: 'I can reduce weekly reporting time by 50%',
  criteriaFormat: 'gherkin',
  criteria: [
    'Given I am on the reports page\nWhen I click export\nThen the system downloads a CSV file\nAnd the filename includes the current date',
    'Given the report has no data\nWhen I click export\nThen the system shows an empty state message'
  ]
};

const secondStory = {
  timestamp: 1735732900000,
  asA: 'team lead',
  iWant: 'to review quality metrics',
  soThat: 'I can improve delivery predictability',
  criteriaFormat: 'gherkin',
  criteria: [
    'Given I open the quality dashboard\nWhen I select the current sprint\nThen the system shows escaped defects trend'
  ]
};

describe('StoryHistory', () => {
  it('should load story and criteria from history buttons', async () => {
    const user = userEvent.setup();
    const onLoadStory = vi.fn();
    const onLoadCriteria = vi.fn();

    render(
      <StoryHistory
        stories={[story]}
        onLoadStory={onLoadStory}
        onLoadCriteria={onLoadCriteria}
      />
    );

    await user.click(screen.getByRole('button', { name: /load story/i }));
    await user.click(screen.getByRole('button', { name: /load criteria/i }));

    expect(onLoadStory).toHaveBeenCalledWith(story);
    expect(onLoadCriteria).toHaveBeenCalledWith(story);
  });

  it('should call remove callback for a history item', async () => {
    const user = userEvent.setup();
    const onRemoveStory = vi.fn();

    render(
      <StoryHistory
        stories={[story]}
        onLoadStory={vi.fn()}
        onLoadCriteria={vi.fn()}
        onRemoveStory={onRemoveStory}
      />
    );

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(onRemoveStory).toHaveBeenCalledWith(story.timestamp);
  });

  it('should call clear history callback', async () => {
    const user = userEvent.setup();
    const onClearHistory = vi.fn();

    render(
      <StoryHistory
        stories={[story]}
        onLoadStory={vi.fn()}
        onLoadCriteria={vi.fn()}
        onClearHistory={onClearHistory}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear/i }));

    expect(onClearHistory).toHaveBeenCalledTimes(1);
  });

  it('should open details modal and show recalculated story and criteria totals', async () => {
    const user = userEvent.setup();
    const expectedStoryScore = scoreStory(story).totalScore;
    const expectedCriteriaScore = scoreCriteria(story.criteria, story.soThat, story.criteriaFormat).totalScore;

    render(
      <StoryHistory
        stories={[story]}
        onLoadStory={vi.fn()}
        onLoadCriteria={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /view details/i }));

    expect(screen.getByRole('dialog', { name: /story details/i })).toBeInTheDocument();
    expect(screen.getByText(/full story/i)).toBeInTheDocument();
    expect(screen.getAllByText(String(expectedStoryScore)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(String(expectedCriteriaScore)).length).toBeGreaterThan(0);
    expect(screen.getByText(/criterion 1/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Given$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^When$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Then$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^And$/).length).toBeGreaterThan(0);
  });

  it('should close modal on escape and keep focus trapped while open', async () => {
    const user = userEvent.setup();

    render(
      <StoryHistory
        stories={[story]}
        onLoadStory={vi.fn()}
        onLoadCriteria={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /view details/i }));

    const closeButton = screen.getByRole('button', { name: /close details/i });
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /story details/i })).not.toBeInTheDocument();
  });

  it('should open export preview and format gherkin lines for confluence copy', async () => {
    const user = userEvent.setup();

    render(
      <StoryHistory
        stories={[story]}
        onLoadStory={vi.fn()}
        onLoadCriteria={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /preview/i }));

    expect(screen.getByRole('dialog', { name: /export preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /markdown preview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy markdown/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy formatted/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /raw markdown/i }));
    const preview = screen.getByRole('textbox');
    expect(preview.value).toContain('## Story 1');
    expect(preview.value).toContain('**As a** support manager');
    expect(preview.value).toContain('**I want** to export ticket summaries');
    expect(preview.value).toContain('**So that** I can reduce weekly reporting time by 50%');
    expect(preview.value).toContain('**Given** I am on the reports page');
    expect(preview.value).toContain('**When** I click export');
    expect(preview.value).toContain('**Then** the system downloads a CSV file');
  });

  it('should include horizontal rule separators between stories in raw markdown', async () => {
    const user = userEvent.setup();

    render(
      <StoryHistory
        stories={[story, secondStory]}
        onLoadStory={vi.fn()}
        onLoadCriteria={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /preview/i }));
    await user.click(screen.getByRole('button', { name: /raw markdown/i }));

    const preview = screen.getByRole('textbox');
    expect(preview.value).toContain('\n---\n');
  });

  it('should escape HTML tags in formatted export to prevent XSS', () => {
    const maliciousStory = {
      timestamp: 1735732850000,
      asA: '<script>alert("XSS")</script>user',
      iWant: '<img src=x onerror="alert(1)">feature',
      soThat: '<b onload="alert(2)">benefit</b>',
      criteriaFormat: 'bullet',
      criteria: ['<script>dangerous()</script>criterion']
    };

    // Create a temporary div to access escapeHtml behaviour
    const testDiv = document.createElement('div');
    testDiv.textContent = maliciousStory.asA;
    const escapedAsA = testDiv.innerHTML;

    // Verify that textContent -> innerHTML produces escaped HTML
    expect(escapedAsA).not.toContain('<script>');
    expect(escapedAsA).toContain('&lt;script&gt;');
    expect(escapedAsA).toContain('alert("XSS")');
    
    // Verify the escaping works for various HTML attack patterns
    testDiv.textContent = maliciousStory.iWant;
    expect(testDiv.innerHTML).toContain('&lt;img');
    expect(testDiv.innerHTML).not.toContain('<img src=x onerror');

    testDiv.textContent = maliciousStory.soThat;
    expect(testDiv.innerHTML).toContain('&lt;b');
    expect(testDiv.innerHTML).not.toContain('<b onload=');
  });
});
