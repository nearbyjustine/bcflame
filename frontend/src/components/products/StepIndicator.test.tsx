import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StepIndicator from './StepIndicator';

describe('StepIndicator', () => {
  it('renders all steps correctly', () => {
    const { container } = render(<StepIndicator currentStep={1} totalSteps={4} />);

    // Should have 4 step circles
    const stepElements = container.querySelectorAll('.w-8.h-8');
    expect(stepElements.length).toBeGreaterThanOrEqual(4);
  });

  it('shows step numbers for upcoming steps', () => {
    render(<StepIndicator currentStep={0} totalSteps={4} />);

    // Current step shows 1, upcoming steps show 2, 3, 4
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('applies active styling to current and completed steps', () => {
    const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

    // Steps 0, 1, 2 should have primary background (completed + current)
    const activeSteps = container.querySelectorAll('.bg-primary');
    expect(activeSteps.length).toBeGreaterThanOrEqual(3);
  });

  it('shows progress bars between steps', () => {
    const { container } = render(<StepIndicator currentStep={1} totalSteps={4} />);

    // Should have 3 progress bars (between 4 steps)
    const progressBars = container.querySelectorAll('.flex-1.h-0\\.5');
    expect(progressBars).toHaveLength(3);
  });

  it('highlights completed progress bars', () => {
    const { container } = render(<StepIndicator currentStep={2} totalSteps={4} />);

    // First 2 progress bars should be primary (completed)
    const completedBars = container.querySelectorAll('.flex-1.h-0\\.5.bg-primary');
    expect(completedBars.length).toBeGreaterThanOrEqual(2);
  });
});
