import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AcceptanceCriteriaForm from '../components/AcceptanceCriteriaForm';

describe('AcceptanceCriteriaForm', () => {
  it('should show blur feedback for gherkin criteria', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<AcceptanceCriteriaForm onSubmit={mockSubmit} storyText="Sample story" />);

    const criterionOne = screen.getByLabelText(/criterion 1/i);
    await user.type(criterionOne, 'Given I am logged in');
    await user.tab();

    expect(screen.getByText(/criterion score:/i)).toBeInTheDocument();
    expect(screen.getByText(/hint:/i)).toBeInTheDocument();
  });

  it('should show bullet-specific blur feedback when bullet format is selected', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<AcceptanceCriteriaForm onSubmit={mockSubmit} storyText="Sample story" />);

    await user.click(screen.getByRole('button', { name: /bullet-point/i }));

    const criterionOne = screen.getByLabelText(/criterion 1/i);
    await user.type(criterionOne, 'Works better');
    await user.tab();

    expect(screen.getByText(/criterion score:/i)).toBeInTheDocument();
    expect(screen.getByText(/start with a clear actor/i)).toBeInTheDocument();
  });

  it('should clear criterion feedback on reset', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();

    render(<AcceptanceCriteriaForm onSubmit={mockSubmit} storyText="Sample story" />);

    const criterionOne = screen.getByLabelText(/criterion 1/i);
    await user.type(criterionOne, 'Given I am logged in');
    await user.tab();

    expect(screen.getByText(/criterion score:/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(criterionOne).toHaveValue('');
    expect(screen.queryByText(/criterion score:/i)).not.toBeInTheDocument();
  });
});
