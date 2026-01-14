import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoSelectionGrid from './PhotoSelectionGrid';

const mockPhotos = [
  { id: 1, attributes: { url: '/photo1.jpg', name: 'Photo 1' } },
  { id: 2, attributes: { url: '/photo2.jpg', name: 'Photo 2' } },
  { id: 3, attributes: { url: '/photo3.jpg', name: 'Photo 3' } },
  { id: 4, attributes: { url: '/photo4.jpg', name: 'Photo 4' } },
  { id: 5, attributes: { url: '/photo5.jpg', name: 'Photo 5' } },
  { id: 6, attributes: { url: '/photo6.jpg', name: 'Photo 6' } },
];

const mockLimits = { min: 1, max: 5 };

describe('PhotoSelectionGrid', () => {
  it('renders all photos', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[]}
        limits={mockLimits}
        onToggle={onToggle}
      />
    );

    expect(screen.getAllByRole('img')).toHaveLength(6);
  });

  it('allows selection up to max limit', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[1, 2, 3, 4]}
        limits={mockLimits}
        onToggle={onToggle}
      />
    );

    // Click unselected photo (id 5) - should call onToggle
    const photoContainers = screen.getAllByRole('img').map(img => img.parentElement);
    fireEvent.click(photoContainers[4]!);

    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it('prevents selection when max is reached', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[0, 1, 2, 3, 4]} // Max 5 reached
        limits={mockLimits}{5}
        onToggle={onToggle}
      />
    );

    // Try to select 6th photo - should not call onToggle
    const photoContainers = screen.getAllByRole('img').map(img => img.parentElement);
    fireEvent.click(photoContainers[5]!);

    // onToggle should not be called for unselected item when max is reached
    expect(onToggle).not.toHaveBeenCalledWith(5);
  });

  it('allows deselection even when max is reached', () => {
    const onToggle = vi.fn();
    render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[0, 1, 2, 3, 4]}
        limits={mockLimits}{5}
        onToggle={onToggle}
      />
    );

    // Click selected photo (index 0) - should allow deselection
    const photoContainers = screen.getAllByRole('img').map(img => img.parentElement);
    fireEvent.click(photoContainers[0]!);

    expect(onToggle).toHaveBeenCalledWith(0);
  });

  it('displays selection count badge', () => {
    render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[0, 1, 2]}
        limits={mockLimits}{5}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText(/3 \/ 5 Selected/i)).toBeInTheDocument();
  });

  it('shows checkmark icon on selected photos', () => {
    render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[0, 2]}
        limits={mockLimits}{5}
        onToggle={vi.fn()}
      />
    );

    // Should have checkmarks for selected photos
    const checkmarks = document.querySelectorAll('.bg-orange-500');
    expect(checkmarks.length).toBeGreaterThanOrEqual(2);
  });

  it('applies orange border to selected photos', () => {
    render(
      <PhotoSelectionGrid
        availablePhotos={mockPhotos}
        selectedPhotoIds={[1, 3]}
        limits={mockLimits}{5}
        onToggle={vi.fn()}
      />
    );

    const selectedBorders = container.querySelectorAll('.border-orange-500');
    expect(selectedBorders.length).toBeGreaterThanOrEqual(2);
  });
});
