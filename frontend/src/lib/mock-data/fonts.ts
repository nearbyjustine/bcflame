import type { FontStyle } from '@/types/customization';

export const MOCK_FONTS: FontStyle[] = [
  {
    id: 1,
    attributes: {
      name: "Bebas Neue",
      font_family: "Bebas Neue",
      category: "display",
      preview_image: { data: null },
      font_file: { data: null },
      sort_order: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  {
    id: 2,
    attributes: {
      name: "Oswald",
      font_family: "Oswald",
      category: "sans_serif",
      preview_image: { data: null },
      font_file: { data: null },
      sort_order: 2,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  {
    id: 3,
    attributes: {
      name: "Montserrat",
      font_family: "Montserrat",
      category: "sans_serif",
      preview_image: { data: null },
      font_file: { data: null },
      sort_order: 3,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  {
    id: 4,
    attributes: {
      name: "Anton",
      font_family: "Anton",
      category: "display",
      preview_image: { data: null },
      font_file: { data: null },
      sort_order: 4,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  },
  {
    id: 5,
    attributes: {
      name: "Righteous",
      font_family: "Righteous",
      category: "display",
      preview_image: { data: null },
      font_file: { data: null },
      sort_order: 5,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    }
  }
];

export const MOCK_FONT_SIZES = [
  { id: 'sm', name: 'Small', value: 24 },
  { id: 'md', name: 'Medium', value: 36 },
  { id: 'lg', name: 'Large', value: 48 },
];
