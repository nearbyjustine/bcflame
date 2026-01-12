import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PreBaggingConfig from './PreBaggingConfig';

const mockOptions = [
  {
    id: 1,
    attributes: {
      name: 'No Pre-Bagging',
      unit_size: null,
      unit_size_unit: 'g',
    },
  },
  {
    id: 2,
    attributes: {
      name: '3.5g Bags',
      unit_size: 3.5,
      unit_size_unit: 'g',
    },
  },
  {
    id: 3,
    attributes: {
      name: '7g Bags',
      unit_size: 7,
      unit_size_unit: 'g',
    },
  },
];

describe('PreBaggingConfig', () => {
  it('renders all pre-bagging options', () => {
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={null}
        totalWeight={0}
        onOptionChange={vi.fn()}
        onWeightChange={vi.fn()}
      />
    );

    expect(screen.getByText('No Pre-Bagging')).toBeInTheDocument();
    expect(screen.getByText('3.5g Bags')).toBeInTheDocument();
    expect(screen.getByText('7g Bags')).toBeInTheDocument();
  });

  it('allows selecting a bagging option', () => {
    const onOptionChange = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={null}
        totalWeight={0}
        onOptionChange={onOptionChange}
        onWeightChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('3.5g Bags'));
    expect(onOptionChange).toHaveBeenCalledWith(2);
  });

  it('displays selected option with active styling', () => {
    const { container } = render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={2}
        totalWeight={100}
        onOptionChange={vi.fn()}
        onWeightChange={vi.fn()}
      />
    );

    const selectedBorder = container.querySelectorAll('.border-orange-500');
    expect(selectedBorder.length).toBeGreaterThanOrEqual(1);
  });

  it('allows incrementing weight', () => {
    const onWeightChange = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={2}
        totalWeight={100}
        onOptionChange={vi.fn()}
        onWeightChange={onWeightChange}
      />
    );

    // Find and click the + button
    const buttons = screen.getAllByRole('button');
    const incrementButton = buttons.find(btn => btn.textContent === '+');
    fireEvent.click(incrementButton!);

    expect(onWeightChange).toHaveBeenCalledWith(110);
  });

  it('allows decrementing weight', () => {
    const onWeightChange = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={2}
        totalWeight={100}
        onOptionChange={vi.fn()}
        onWeightChange={onWeightChange}
      />
    );

    // Find and click the - button
    const buttons = screen.getAllByRole('button');
    const decrementButton = buttons.find(btn => btn.textContent === '-');
    fireEvent.click(decrementButton!);

    expect(onWeightChange).toHaveBeenCalledWith(90);
  });

  it('prevents weight from going below zero', () => {
    const onWeightChange = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={2}
        totalWeight={5}
        onOptionChange={vi.fn()}
        onWeightChange={onWeightChange}
      />
    );

    // Click - button which should go to 0, not negative
    const buttons = screen.getAllByRole('button');
    const decrementButton = buttons.find(btn => btn.textContent === '-');
    fireEvent.click(decrementButton!);

    expect(onWeightChange).toHaveBeenCalledWith(0);
  });

  it('calculates and displays estimated bag count', () => {
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={2} // 3.5g bags
        totalWeight={350} // 350g
        onOptionChange={vi.fn()}
        onWeightChange={vi.fn()}
      />
    );

    // Should show: 350g / 3.5g = 100 bags
    expect(screen.getByText(/100 bags/i)).toBeInTheDocument();
    expect(screen.getByText(/3.5g each/i)).toBeInTheDocument();
  });

  it('does not show bag count if option has no unit_size', () => {
    const { container } = render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={1} // No Pre-Bagging (no unit_size)
        totalWeight={100}
        onOptionChange={vi.fn()}
        onWeightChange={vi.fn()}
      />
    );

    // Should not show "Estimated X bags" message
    expect(screen.queryByText(/estimated/i)).not.toBeInTheDocument();
  });

  it('allows manual weight input', () => {
    const onWeightChange = vi.fn();
    render(
      <PreBaggingConfig
        options={mockOptions}
        selectedId={2}
        totalWeight={100}
        onOptionChange={vi.fn()}
        onWeightChange={onWeightChange}
      />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '250' } });

    expect(onWeightChange).toHaveBeenCalledWith(250);
  });
});
