import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreBaggingConfig from './PreBaggingConfig';

const mockOptions = [
  {
    id: 1,
    attributes: {
      name: 'No Pre-Bagging',
      packaging_type: 'mylar_bag' as const,
      description: 'No pre-bagging',
      available_weights: [],
      unit_size: 0,
      unit_size_unit: 'g',
      sort_order: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 2,
    attributes: {
      name: '3.5g Bags',
      packaging_type: 'mylar_bag' as const,
      description: '3.5g mylar bags',
      available_weights: ['3.5g'],
      unit_size: 3.5,
      unit_size_unit: 'g',
      sort_order: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  {
    id: 3,
    attributes: {
      name: '7g Bags',
      packaging_type: 'mylar_bag' as const,
      description: '7g mylar bags',
      available_weights: ['7g'],
      unit_size: 7,
      unit_size_unit: 'g',
      sort_order: 3,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
];

describe('PreBaggingConfig', () => {
  it('renders all pre-bagging options', () => {
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[]}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('No Pre-Bagging')).toBeInTheDocument();
    expect(screen.getByText('3.5g Bags')).toBeInTheDocument();
    expect(screen.getByText('7g Bags')).toBeInTheDocument();
  });

  it('allows selecting a bagging option', () => {
    const onUpdate = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[]}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    );

    // Click increment button for 3.5g Bags option
    const buttons = screen.getAllByRole('button');
    const incrementButtons = buttons.filter(btn => btn.textContent === '+');
    const secondIncrementButton = incrementButtons[1];
    if (secondIncrementButton) {
      fireEvent.click(secondIncrementButton); // Second option (3.5g)
    }

    expect(onUpdate).toHaveBeenCalledWith(2, 1, 3.5, 'g');
  });

  it('displays selected option with active styling', () => {
    const { container } = render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[{ optionId: 2, quantity: 10, unitSize: 3.5, unitSizeUnit: 'g' }]}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // Should show quantity 10 in the input for option 2
    const inputs = screen.getAllByRole('spinbutton');
    const option2Input = inputs[1]; // Second option
    expect(option2Input).toHaveValue(10);
  });

  it('allows incrementing quantity', () => {
    const onUpdate = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[{ optionId: 2, quantity: 5, unitSize: 3.5, unitSizeUnit: 'g' }]}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    );

    // Find and click the + button for option 2
    const buttons = screen.getAllByRole('button');
    const incrementButtons = buttons.filter(btn => btn.textContent === '+');
    const secondIncrementButton = incrementButtons[1];
    if (secondIncrementButton) {
      fireEvent.click(secondIncrementButton); // Second option
    }

    expect(onUpdate).toHaveBeenCalledWith(2, 6, 3.5, 'g');
  });

  it('allows decrementing quantity', () => {
    const onUpdate = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[{ optionId: 2, quantity: 5, unitSize: 3.5, unitSizeUnit: 'g' }]}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    );

    // Find and click the - button for option 2
    const buttons = screen.getAllByRole('button');
    const decrementButtons = buttons.filter(btn => btn.textContent === '-');
    const secondDecrementButton = decrementButtons[1];
    if (secondDecrementButton) {
      fireEvent.click(secondDecrementButton); // Second option
    }

    expect(onUpdate).toHaveBeenCalledWith(2, 4, 3.5, 'g');
  });

  it('prevents quantity from going below zero', () => {
    const onRemove = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[{ optionId: 2, quantity: 1, unitSize: 3.5, unitSizeUnit: 'g' }]}
        onUpdate={vi.fn()}
        onRemove={onRemove}
      />
    );

    // Click - button when quantity is 1, should call onRemove
    const buttons = screen.getAllByRole('button');
    const decrementButtons = buttons.filter(btn => btn.textContent === '-');
    const secondDecrementButton = decrementButtons[1];
    if (secondDecrementButton) {
      fireEvent.click(secondDecrementButton); // Second option
    }

    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it('displays summary when selections exist', () => {
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[
          { optionId: 2, quantity: 10, unitSize: 3.5, unitSizeUnit: 'g' },
          { optionId: 3, quantity: 5, unitSize: 7, unitSizeUnit: 'g' }
        ]}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // Should show summary section
    expect(screen.getByText('Pre-Bagging Summary:')).toBeInTheDocument();
    expect(screen.getByText('10x 3.5g Bags')).toBeInTheDocument();
    expect(screen.getByText('5x 7g Bags')).toBeInTheDocument();
  });

  it('does not show summary when selections are empty', () => {
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[]}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // Should not show summary section
    expect(screen.queryByText('Pre-Bagging Summary:')).not.toBeInTheDocument();
  });

  it('allows manual quantity input', () => {
    const onUpdate = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selections={[{ optionId: 2, quantity: 5, unitSize: 3.5, unitSizeUnit: 'g' }]}
        onUpdate={onUpdate}
        onRemove={vi.fn()}
      />
    );

    const inputs = screen.getAllByRole('spinbutton');
    const option2Input = inputs[1]; // Second option
    fireEvent.change(option2Input, { target: { value: '25' } });

    expect(onUpdate).toHaveBeenCalledWith(2, 25, 3.5, 'g');
  });
});
