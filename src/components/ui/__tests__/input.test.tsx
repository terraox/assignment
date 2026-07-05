import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from '../input';

describe('Input Component', () => {
  it('should render an input element', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should accept and display value', () => {
    render(<Input defaultValue="test value" />);
    const input = screen.getByDisplayValue('test value');
    expect(input).toBeInTheDocument();
  });

  it('should handle changes', () => {
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new text' } });
    expect(input.value).toBe('new text');
  });

  it('should accept custom class names', () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    const input = screen.getByPlaceholderText('Custom');
    expect(input).toHaveClass('custom-input');
  });
});
