import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AcceptanceCriteriaForm from '../components/AcceptanceCriteriaForm';

const getCriterionField = (index) => screen.getByLabelText(new RegExp(`Criterion ${index}`, 'i'));

describe('AcceptanceCriteriaForm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render the form with default Gherkin format selected', () => {
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: /bullet point format/i })).not.toBeChecked();
    expect(screen.getAllByPlaceholderText(/given \[context\]/i).length).toBeGreaterThan(0);
  });

  it('should switch placeholder when Bullet-Point format is selected', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('checkbox', { name: /bullet point format/i }));

    expect(screen.getAllByPlaceholderText(/the system\/user must/i).length).toBeGreaterThan(0);
  });

  it('should call onSubmit with criteria and selected format', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<AcceptanceCriteriaForm onSubmit={mockSubmit} />);

    await user.type(getCriterionField(1), 'Given I am logged in When I click export Then I see a file');

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

    await user.click(screen.getByRole('checkbox', { name: /bullet point format/i }));

    await user.type(getCriterionField(1), 'The system must validate user input before submission');

    await user.click(screen.getByRole('button', { name: /score my criteria/i }));

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'bullet' })
    );
  });

  it('should show a blur hint when a criterion does not start with a Gherkin keyword', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.type(getCriterionField(1), 'User logs in to the system');
    await user.tab(); // trigger blur

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByRole('note').textContent).toMatch(/given|when|then/i);
  });

  it('should show a blur hint for bullet format when criterion does not start with expected prefix', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('checkbox', { name: /bullet point format/i }));

    await user.type(getCriterionField(1), 'User logs in to the system without a proper prefix');
    await user.tab();

    expect(screen.getByRole('note')).toBeInTheDocument();
    expect(screen.getByRole('note').textContent).toMatch(/the system must|the user can/i);
  });

  it('should not show a hint when criterion is empty', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.click(getCriterionField(1));
    await user.tab(); // blur without typing

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('should clear hints when the format is changed', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.type(getCriterionField(1), 'User does something without Gherkin keywords');
    await user.tab(); // trigger hint

    expect(screen.getByRole('note')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /bullet point format/i }));

    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('should reset form and hints when Reset is clicked', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.type(getCriterionField(1), 'Something without format keywords');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(getCriterionField(1)).toHaveValue('');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });

  it('should prefill criteria and format when initialCriteriaData is provided', () => {
    render(
      <AcceptanceCriteriaForm
        onSubmit={vi.fn()}
        initialCriteriaData={{
          format: 'bullet',
          criteria: [
            'The system must load criteria from history',
            'The user can edit loaded criteria before scoring'
          ]
        }}
      />
    );

    expect(screen.getByRole('checkbox', { name: /bullet point format/i })).toBeChecked();
    expect(getCriterionField(1)).toHaveValue('The system must load criteria from history');
    expect(getCriterionField(2)).toHaveValue('The user can edit loaded criteria before scoring');
  });

  it('should allow adding criteria fields up to 7', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    const getAddButton = () => screen.queryByRole('button', { name: /add another criterion/i });

    for (let i = 0; i < 4; i += 1) {
      await user.click(getAddButton());
    }

    expect(getCriterionField(7)).toBeInTheDocument();
    expect(getAddButton()).not.toBeInTheDocument();
    expect(screen.getByText(/recommended: 3-7/i)).toBeInTheDocument();
  });

  it('should apply default GUI template for gherkin format', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /use gui changes/i }));

    expect(getCriterionField(1).value).toMatch(/given/i);
    expect(getCriterionField(2).value).toMatch(/when/i);
    expect(getCriterionField(3).value).toMatch(/then|validation/i);
  });

  it('should save current criteria as a template and load it later', async () => {
    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.type(getCriterionField(1), 'Given a saved template scenario When I run save Then it is persisted');

    await user.type(screen.getByPlaceholderText(/template name/i), 'My Reusable Template');
    await user.click(screen.getByRole('button', { name: /save current/i }));

    const stored = JSON.parse(localStorage.getItem('acceptanceCriteriaTemplates'));
    expect(stored).toHaveLength(1);
    expect(stored[0]).toEqual(expect.objectContaining({
      name: 'My Reusable Template',
      format: 'gherkin'
    }));

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(getCriterionField(1)).toHaveValue('');

    await user.selectOptions(screen.getByRole('combobox', { name: /saved templates/i }), stored[0].id);
    await user.click(screen.getByRole('button', { name: /^load$/i }));

    expect(getCriterionField(1).value).toMatch(/given a saved template scenario/i);
  });

  it('should delete a saved template', async () => {
    localStorage.setItem('acceptanceCriteriaTemplates', JSON.stringify([
      {
        id: 'temp-1',
        name: 'Delete Me',
        format: 'bullet',
        criteria: ['The system must delete this template.']
      }
    ]));

    const user = userEvent.setup();
    render(<AcceptanceCriteriaForm onSubmit={vi.fn()} />);

    await user.selectOptions(screen.getByRole('combobox', { name: /saved templates/i }), 'temp-1');
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.getByRole('combobox', { name: /saved templates/i })).toHaveValue('');
    const stored = JSON.parse(localStorage.getItem('acceptanceCriteriaTemplates'));
    expect(stored).toEqual([]);
  });
});
