import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from './FilterPanel';

describe('FilterPanel', () => {
  const mockOnFilterChange = vi.fn();

  const defaultFilters = {
    search: undefined,
    category: undefined,
    featured: undefined,
    onSale: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minTHC: undefined,
    maxTHC: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all filter controls', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    expect(screen.getByPlaceholderText(/search products/i)).toBeInTheDocument();
    expect(screen.getByText(/all/i)).toBeInTheDocument();
    expect(screen.getByText(/indica/i)).toBeInTheDocument();
    expect(screen.getByText(/hybrid/i)).toBeInTheDocument();
    expect(screen.getByText(/sativa/i)).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const searchInput = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'OG Kush' } });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      search: 'OG Kush',
    });
  });

  it('calls onFilterChange when category button is clicked', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const indicaButton = screen.getByText(/indica/i);
    fireEvent.click(indicaButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      category: 'Indica',
    });
  });

  it('toggles category to undefined when same category is clicked again', () => {
    const filtersWithCategory = { ...defaultFilters, category: 'Indica' as const };
    render(<FilterPanel filters={filtersWithCategory} onFilterChange={mockOnFilterChange} />);

    const indicaButton = screen.getByText(/indica/i);
    fireEvent.click(indicaButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      category: undefined,
    });
  });

  it('toggles featured filter on', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const featuredCheckbox = screen.getByLabelText(/featured only/i);
    fireEvent.click(featuredCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      featured: true,
    });
  });

  it('toggles featured filter off', () => {
    const filtersWithFeatured = { ...defaultFilters, featured: true };
    render(<FilterPanel filters={filtersWithFeatured} onFilterChange={mockOnFilterChange} />);

    const featuredCheckbox = screen.getByLabelText(/featured only/i);
    fireEvent.click(featuredCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      featured: undefined,
    });
  });

  it('toggles on sale filter on', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const onSaleCheckbox = screen.getByLabelText(/on sale only/i);
    fireEvent.click(onSaleCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      onSale: true,
    });
  });

  it('toggles on sale filter off', () => {
    const filtersWithOnSale = { ...defaultFilters, onSale: true };
    render(<FilterPanel filters={filtersWithOnSale} onFilterChange={mockOnFilterChange} />);

    const onSaleCheckbox = screen.getByLabelText(/on sale only/i);
    fireEvent.click(onSaleCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      onSale: undefined,
    });
  });

  it('calls onFilterChange when price range changes', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const minPriceInput = screen.getByLabelText(/min price/i);
    const maxPriceInput = screen.getByLabelText(/max price/i);

    fireEvent.change(minPriceInput, { target: { value: '10' } });
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minPrice: 10,
    });

    fireEvent.change(maxPriceInput, { target: { value: '50' } });
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      maxPrice: 50,
    });
  });

  it('calls onFilterChange when THC range changes', () => {
    render(<FilterPanel filters={defaultFilters} onFilterChange={mockOnFilterChange} />);

    const minTHCInput = screen.getByLabelText(/min thc %/i);
    const maxTHCInput = screen.getByLabelText(/max thc %/i);

    fireEvent.change(minTHCInput, { target: { value: '15' } });
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      minTHC: 15,
    });

    fireEvent.change(maxTHCInput, { target: { value: '25' } });
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      maxTHC: 25,
    });
  });

  it('displays active category with different styling', () => {
    const filtersWithCategory = { ...defaultFilters, category: 'Indica' as const };
    render(<FilterPanel filters={filtersWithCategory} onFilterChange={mockOnFilterChange} />);

    const indicaButton = screen.getByText(/indica/i);
    expect(indicaButton).toHaveClass('bg-blue-600');
  });

  it('clears all filters when reset button is clicked', () => {
    const activeFilters = {
      search: 'Kush',
      category: 'Indica' as const,
      featured: true,
      onSale: true,
      minPrice: 10,
      maxPrice: 50,
      minTHC: 15,
      maxTHC: 25,
    };

    render(<FilterPanel filters={activeFilters} onFilterChange={mockOnFilterChange} />);

    const resetButton = screen.getByText(/clear filters/i);
    fireEvent.click(resetButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith(defaultFilters);
  });
});
