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

describe('BudStyleSelector', () => {
  it('renders all bud style options', () => {
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[]}
        allowMultiple={true}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Whole Flower')).toBeInTheDocument();
    expect(screen.getByText('Shake')).toBeInTheDocument();
    expect(screen.getByText('Popcorn Buds')).toBeInTheDocument();
  });

  it('allows multiple selections when allowMultiple is true', () => {
    const onChange = vi.fn();
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1]}
        allowMultiple={true}
        onChange={onChange}
      />
    );

    // Click second option
    fireEvent.click(screen.getByText('Shake'));

    // Should add to array, not replace
    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it('allows single selection only when allowMultiple is false', () => {
    const onChange = vi.fn();
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1]}
        allowMultiple={false}
        onChange={onChange}
      />
    );

    // Click second option
    fireEvent.click(screen.getByText('Shake'));

    // Should replace array with single item
    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it('allows deselection in multi-select mode', () => {
    const onChange = vi.fn();
    render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1, 2]}
        allowMultiple={true}
        onChange={onChange}
      />
    );

    // Click already selected option
    fireEvent.click(screen.getByText('Shake'));

    // Should remove from array
    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it('applies active styling to selected options', () => {
    const { container } = render(
      <BudStyleSelector
        budStyles={mockBudStyles}
        selectedIds={[1, 3]}
        allowMultiple={true}
        onChange={vi.fn()}
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
        allowMultiple={true}
        onChange={vi.fn()}
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
        allowMultiple={true}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Full flower buds')).toBeInTheDocument();
    expect(screen.getByText('Small pieces')).toBeInTheDocument();
  });
});
