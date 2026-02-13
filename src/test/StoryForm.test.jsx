import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoryForm from '../components/StoryForm';

describe('StoryForm', () => {
  it('should render all three input fields', () => {
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    expect(screen.getByLabelText(/as a/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i want/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/so that/i)).toBeInTheDocument();
  });

  it('should display word count', () => {
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    expect(screen.getByText(/word count:/i)).toBeInTheDocument();
  });

  it('should update word count as user types', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    const asAInput = screen.getByLabelText(/as a/i);
    await user.type(asAInput, 'developer');
    
    // Check that the word count changed from 0 to 1
    expect(screen.getByText('1', { selector: '.font-semibold' })).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted with all fields filled', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    await user.type(screen.getByLabelText(/as a/i), 'developer');
    await user.type(screen.getByLabelText(/i want/i), 'to write tests');
    await user.type(screen.getByLabelText(/so that/i), 'I can ensure quality');
    
    await user.click(screen.getByRole('button', { name: /score my story/i }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      asA: 'developer',
      iWant: 'to write tests',
      soThat: 'I can ensure quality'
    });
  });

  it('should not submit when fields are empty', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    await user.click(screen.getByRole('button', { name: /score my story/i }));
    
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should reset all fields when Reset button is clicked', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    const asAInput = screen.getByLabelText(/as a/i);
    const iWantInput = screen.getByLabelText(/i want/i);
    const soThatInput = screen.getByLabelText(/so that/i);
    
    await user.type(asAInput, 'developer');
    await user.type(iWantInput, 'to write code');
    await user.type(soThatInput, 'to deliver value');
    
    await user.click(screen.getByRole('button', { name: /reset/i }));
    
    expect(asAInput).toHaveValue('');
    expect(iWantInput).toHaveValue('');
    expect(soThatInput).toHaveValue('');
  });

  it('should have Score My Story and Reset buttons', () => {
    const mockSubmit = vi.fn();
    render(<StoryForm onSubmit={mockSubmit} />);
    
    expect(screen.getByRole('button', { name: /score my story/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });
});
