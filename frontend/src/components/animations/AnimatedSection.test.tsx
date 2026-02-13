import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedSection } from './AnimatedSection';

// Mock Framer Motion to avoid JSDOM issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  useInView: () => true,
}));

// Mock custom hooks
vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock('@/hooks/useScrollAnimation', () => ({
  useScrollAnimation: vi.fn(() => ({
    ref: { current: null },
    isInView: true,
  })),
}));

describe('AnimatedSection', () => {
  it('renders children correctly', () => {
    render(
      <AnimatedSection>
        <div>Test Content</div>
      </AnimatedSection>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedSection className="custom-class">
        <div>Test</div>
      </AnimatedSection>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with fadeInUp variant by default', () => {
    render(
      <AnimatedSection>
        <div>Test</div>
      </AnimatedSection>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders with fadeIn variant', () => {
    render(
      <AnimatedSection variant="fadeIn">
        <div>Test</div>
      </AnimatedSection>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders with scaleIn variant', () => {
    render(
      <AnimatedSection variant="scaleIn">
        <div>Test</div>
      </AnimatedSection>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders with slideInFromLeft variant', () => {
    render(
      <AnimatedSection variant="slideInFromLeft">
        <div>Test</div>
      </AnimatedSection>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders with slideInFromRight variant', () => {
    render(
      <AnimatedSection variant="slideInFromRight">
        <div>Test</div>
      </AnimatedSection>
    );

    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('renders plain div when reduced motion is preferred', async () => {
    const { useReducedMotion } = await import('@/hooks/useReducedMotion');
    vi.mocked(useReducedMotion).mockReturnValue(true);

    const { container } = render(
      <AnimatedSection className="test-class">
        <div>Test</div>
      </AnimatedSection>
    );

    expect(container.firstChild).toHaveClass('test-class');
    expect(screen.getByText('Test')).toBeInTheDocument();

    // Reset mock
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });
});
