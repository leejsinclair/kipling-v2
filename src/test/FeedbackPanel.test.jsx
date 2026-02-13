import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FeedbackPanel from '../components/FeedbackPanel';

describe('FeedbackPanel', () => {
  it('should render nothing when result is null', () => {
    const { container } = render(<FeedbackPanel result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display feedback messages', () => {
    const result = {
      feedback: [
        'Great length! Clear and concise.',
        'Excellent clarity! Your language is direct and simple.'
      ],
      suggestions: []
    };
    
    render(<FeedbackPanel result={result} />);
    
    expect(screen.getByText(/great length/i)).toBeInTheDocument();
    expect(screen.getByText(/excellent clarity/i)).toBeInTheDocument();
  });

  it('should display suggestions', () => {
    const result = {
      feedback: [],
      suggestions: [
        "Try starting your 'So that' with an action verb",
        "Use simpler, more direct language"
      ]
    };
    
    render(<FeedbackPanel result={result} />);
    
    expect(screen.getByText(/try starting/i)).toBeInTheDocument();
    expect(screen.getByText(/use simpler/i)).toBeInTheDocument();
  });

  it('should display both feedback and suggestions', () => {
    const result = {
      feedback: ['Your story is complete'],
      suggestions: ['Add more specific outcomes']
    };
    
    render(<FeedbackPanel result={result} />);
    
    expect(screen.getByText(/your story is complete/i)).toBeInTheDocument();
    expect(screen.getByText(/add more specific/i)).toBeInTheDocument();
  });

  it('should show placeholder when no feedback or suggestions', () => {
    const result = {
      feedback: [],
      suggestions: []
    };
    
    render(<FeedbackPanel result={result} />);
    
    expect(screen.getByText(/submit a story to see feedback/i)).toBeInTheDocument();
  });

  it('should have Analysis section when feedback exists', () => {
    const result = {
      feedback: ['Good work'],
      suggestions: []
    };
    
    render(<FeedbackPanel result={result} />);
    
    expect(screen.getByText(/analysis:/i)).toBeInTheDocument();
  });

  it('should have Suggestions section when suggestions exist', () => {
    const result = {
      feedback: [],
      suggestions: ['Improve your story']
    };
    
    render(<FeedbackPanel result={result} />);
    
    expect(screen.getByText(/suggestions:/i)).toBeInTheDocument();
  });
});
