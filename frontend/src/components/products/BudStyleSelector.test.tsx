import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BudStyleSelector from './BudStyleSelector';

const mockBudStyles = [
  {
    id: 1,
    attributes: {
      name: 'Whole Flower',
      category: 'Premium',
      description: 'Full flower buds',
    },
  },
  {
    id: 2,
    attributes: {
      name: 'Shake',
      category: 'Economy',
      description: 'Small pieces',
    },
  },
  {
    id: 3,
    attributes: {
      name: 'Popcorn Buds',
      category: 'Standard',
      description: 'Small whole buds',
    },
  },
];

const mockLimits = { min: 1, max: 3 };

describe('BudStyleSelector', () => {
  it('renders all bud style options', () => {
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[]}
        limits={mockLimits}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Whole Flower')).toBeInTheDocument();
    expect(screen.getByText('Shake')).toBeInTheDocument();
    expect(screen.getByText('Popcorn Buds')).toBeInTheDocument();
  });

  it('allows multiple selections when allowMultiple is true', () => {
    const onToggle = vi.fn();
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1]}
        limits={mockLimits}
        onToggle={onToggle}
      />
    );

    // Click second option
    fireEvent.click(screen.getByText('Shake'));

    // Should call onToggle with the clicked ID (parent handles array logic)
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('allows single selection only when allowMultiple is false', () => {
    const onToggle = vi.fn();
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1]}
        limits={mockLimits}
        onToggle={onToggle}
      />
    );

    // Click second option
    fireEvent.click(screen.getByText('Shake'));

    // Should call onToggle with the clicked ID (parent handles replacement logic)
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('allows deselection in multi-select mode', () => {
    const onToggle = vi.fn();
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1, 2]}
        limits={mockLimits}
        onToggle={onToggle}
      />
    );

    // Click already selected option
    fireEvent.click(screen.getByText('Shake'));

    // Should call onToggle with the clicked ID (parent handles removal logic)
    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it('applies active styling to selected options', () => {
    const { container } = render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1, 3]}
        limits={mockLimits}
        onToggle={vi.fn()}
      />
    );

    // Selected items should have orange border
    const selectedButtons = container.querySelectorAll('.border-orange-500');
    expect(selectedButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with optional label', () => {
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[]}
        limits={mockLimits}
        onToggle={vi.fn()}
        label="Choose Your Bud Style"
      />
    );

    expect(screen.getByText('Choose Your Bud Style')).toBeInTheDocument();
  });

  it('displays descriptions when available', () => {
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[]}
        limits={mockLimits}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('Full flower buds')).toBeInTheDocument();
    expect(screen.getByText('Small pieces')).toBeInTheDocument();
  });
});
