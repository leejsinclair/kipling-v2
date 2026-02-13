import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScoreBreakdown from '../components/ScoreBreakdown';

describe('ScoreBreakdown', () => {
  it('should render nothing when result is null', () => {
    const { container } = render(<ScoreBreakdown result={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display total score', () => {
    const result = {
      totalScore: 45,
      breakdown: {
        completeness: 10,
        length: 8,
        clarity: 9,
        soThatQuality: 15,
        creativity: 3
      },
      wordCount: 25
    };
    
    render(<ScoreBreakdown result={result} />);
    const scores = screen.getAllByText('45');
    expect(scores.length).toBeGreaterThan(0);
  });

  it('should display all score categories', () => {
    const result = {
      totalScore: 45,
      breakdown: {
        completeness: 10,
        length: 8,
        clarity: 9,
        soThatQuality: 15,
        creativity: 3
      },
      wordCount: 25
    };
    
    render(<ScoreBreakdown result={result} />);
    
    expect(screen.getByText(/completeness/i)).toBeInTheDocument();
    expect(screen.getByText(/length/i)).toBeInTheDocument();
    expect(screen.getByText(/clarity/i)).toBeInTheDocument();
    expect(screen.getByText(/value statement/i)).toBeInTheDocument();
    expect(screen.getByText(/creativity/i)).toBeInTheDocument();
  });

  it('should display individual scores correctly', () => {
    const result = {
      totalScore: 45,
      breakdown: {
        completeness: 10,
        length: 8,
        clarity: 9,
        soThatQuality: 15,
        creativity: 3
      },
      wordCount: 25
    };
    
    render(<ScoreBreakdown result={result} />);
    
    expect(screen.getByText('10/10')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
    expect(screen.getByText('15/20')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('should display word count info', () => {
    const result = {
      totalScore: 45,
      breakdown: {
        completeness: 10,
        length: 8,
        clarity: 9,
        soThatQuality: 15,
        creativity: 3
      },
      wordCount: 25
    };
    
    render(<ScoreBreakdown result={result} />);
    expect(screen.getByText(/25 words/i)).toBeInTheDocument();
  });

  it('should show high score as green', () => {
    const result = {
      totalScore: 52,
      breakdown: {
        completeness: 10,
        length: 10,
        clarity: 10,
        soThatQuality: 18,
        creativity: 4
      },
      wordCount: 25
    };
    
    const { container } = render(<ScoreBreakdown result={result} />);
    const scoreElement = container.querySelector('.text-green-600');
    expect(scoreElement).toBeInTheDocument();
  });

  it('should show medium score as yellow', () => {
    const result = {
      totalScore: 40,
      breakdown: {
        completeness: 10,
        length: 8,
        clarity: 8,
        soThatQuality: 12,
        creativity: 2
      },
      wordCount: 22
    };
    
    const { container } = render(<ScoreBreakdown result={result} />);
    const scoreElement = container.querySelector('.text-yellow-600');
    expect(scoreElement).toBeInTheDocument();
  });

  it('should show low score as red', () => {
    const result = {
      totalScore: 25,
      breakdown: {
        completeness: 10,
        length: 5,
        clarity: 5,
        soThatQuality: 3,
        creativity: 2
      },
      wordCount: 8
    };
    
    const { container } = render(<ScoreBreakdown result={result} />);
    const scoreElement = container.querySelector('.text-red-600');
    expect(scoreElement).toBeInTheDocument();
  });
});
