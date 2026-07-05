import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardContent } from '../card';

describe('Card Components', () => {
  it('should render the Card container', () => {
    const { container } = render(<Card>Card Content</Card>);
    expect(container.firstChild).toHaveClass('text-card-foreground flex flex-col gap-2 rounded-lg p-1.5 bg-pop');
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should render the CardHeader', () => {
    render(
      <Card>
        <CardHeader>Header Info</CardHeader>
      </Card>
    );
    expect(screen.getByText('Header Info')).toHaveClass('@container/card-header h-9 grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 pl-1 pr-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6');
  });

  it('should render the CardTitle', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Main Title</CardTitle>
        </CardHeader>
      </Card>
    );
    const title = screen.getByText('Main Title');
    expect(title).toHaveClass('font-medium text-sm');
  });

  it('should render the CardContent', () => {
    render(
      <Card>
        <CardContent>Content Area</CardContent>
      </Card>
    );
    expect(screen.getByText('Content Area')).toHaveClass('p-3 py-2 rounded bg-card');
  });
});
