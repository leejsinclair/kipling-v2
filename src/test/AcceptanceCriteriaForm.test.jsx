import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AcceptanceCriteriaForm from '../components/AcceptanceCriteriaForm';

describe('AcceptanceCriteriaForm', () => {
  it('should render the form with default Gherkin format selected', () => {
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: /gherkin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bullet/i })).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/given \[context\]/i).length).toBeGreaterThan(0);
  });

  it('should switch placeholder when Bullet-Point format is selected', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /bullet/i }));

    expect(screen.getAllByPlaceholderText(/the system\/user must/i).length).toBeGreaterThan(0);
  });

  it('should call onSubmit with criteria and selected format', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<AcceptanceCriteriaForm onSubmit={mockSubmit} />);

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0], 'Given I am logged in When I click export Then I see a file');

    await user.click(screen.getByRole('button', { name: /score my criteria/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'gherkin',
        criteria: expect.arrayContaining([expect.stringContaining('Given')])
      })
    );
  });

  it('should call onSubmit with bullet format when bullet is selected', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<AcceptanceCriteriaForm onSubmit={mockSubmit} />);

    await user.click(screen.getByRole('button', { name: /bullet/i }));

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0], 'The system must validate user input before submission');

    await user.click(screen.getByRole('button', { name: /score my criteria/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'bullet' })
    );
  });

  it('should show a blur hint when a criterion does not start with a Gherkin keyword', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0], 'User logs in to the system');
    await user.tab(); // trigger blur

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByRole('note').textContent).toMatch(/given|when|then/i);
  });

  it('should show a blur hint for bullet format when criterion does not start with expected prefix', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /bullet/i }));

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0], 'User logs in to the system without a proper prefix');
    await user.tab();

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByRole('note').textContent).toMatch(/the system must|the user can/i);
  });

  it('should not show a hint when criterion is empty', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    const textareas = screen.getAllByRole('textbox');
    await user.click(textareas[0]);
    await user.tab(); // blur without typing

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('should clear hints when the format is changed', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0], 'User does something without Gherkin keywords');
    await user.tab(); // trigger hint

    expect(screen.getByRole('note')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /bullet/i }));

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('should reset form and hints when Reset is clicked', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    const textareas = screen.getAllByRole('textbox');
    await user.type(textareas[0], 'Something without format keywords');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(textareas[0]).toHaveValue('');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
