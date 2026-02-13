import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoHero } from './VideoHero';

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    section: ({ children, className, style, ...props }: any) => (
      <section className={className} style={style} {...props}>
        {children}
      </section>
    ),
    h1: ({ children, className, ...props }: any) => (
      <h1 className={className} {...props}>
        {children}
      </h1>
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} {...props}>
        {children}
      </p>
    ),
    button: ({ children, className, onClick, ...props }: any) => (
      <button className={className} onClick={onClick} {...props}>
        {children}
      </button>
    ),
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 1 }),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
}));

describe('VideoHero', () => {
  it('renders video element with correct attributes', () => {
    const { container } = render(<VideoHero videoSrc="/test-video.mp4" />);

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveProperty('autoplay', true);
    expect(video).toHaveProperty('muted', true);
    expect(video).toHaveProperty('loop', true);
    expect(video).toHaveProperty('playsInline', true);
    expect(video).toHaveAttribute('preload', 'metadata');
  });

  it('displays title when provided', () => {
    render(<VideoHero videoSrc="/test-video.mp4" title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('displays subtitle when provided', () => {
    render(
      <VideoHero
        videoSrc="/test-video.mp4"
        title="Test Title"
        subtitle="Test Subtitle"
      />
    );

    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders without title and subtitle', () => {
    const { container } = render(<VideoHero videoSrc="/test-video.mp4" />);

    const video = container.querySelector('video');
    expect(video).toBeInTheDocument();
  });

  it('renders scroll indicator', () => {
    render(<VideoHero videoSrc="/test-video.mp4" />);

    expect(screen.getByText('Scroll')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-down-icon')).toBeInTheDocument();
  });

  it('calls onScrollClick callback when scroll button is clicked', () => {
    const onScrollClick = vi.fn();
    render(<VideoHero videoSrc="/test-video.mp4" onScrollClick={onScrollClick} />);

    const scrollButton = screen.getByLabelText('Scroll to products');
    fireEvent.click(scrollButton);

    expect(onScrollClick).toHaveBeenCalledTimes(1);
  });

  it('scrolls to products section when no onScrollClick provided', () => {
    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    const mockElement = {
      scrollIntoView: scrollIntoViewMock,
    };
    vi.spyOn(document, 'getElementById').mockReturnValue(
      mockElement as unknown as HTMLElement
    );

    render(<VideoHero videoSrc="/test-video.mp4" />);

    const scrollButton = screen.getByLabelText('Scroll to products');
    fireEvent.click(scrollButton);

    expect(document.getElementById).toHaveBeenCalledWith('products-content');
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });

    vi.restoreAllMocks();
  });

  it('shows loading spinner initially', () => {
    const { container } = render(<VideoHero videoSrc="/test-video.mp4" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('hides loading spinner after video loads', () => {
    const { container } = render(<VideoHero videoSrc="/test-video.mp4" />);

    const video = container.querySelector('video');
    fireEvent.loadedData(video!);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).not.toBeInTheDocument();
  });

  it('renders gradient overlay', () => {
    const { container } = render(<VideoHero videoSrc="/test-video.mp4" />);

    const gradient = container.querySelector('.bg-gradient-to-b');
    expect(gradient).toBeInTheDocument();
  });

  it('video source uses correct src', () => {
    const { container } = render(<VideoHero videoSrc="/custom-video.mp4" />);

    const source = container.querySelector('source');
    expect(source).toHaveAttribute('src', '/custom-video.mp4');
    expect(source).toHaveAttribute('type', 'video/mp4');
  });
});
