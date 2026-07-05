import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Logo } from '../Logo';

describe('Logo Component', () => {
  it('should render the logo SVG', () => {
    const { container } = render(<Logo />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });
});
