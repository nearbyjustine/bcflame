import type { BackgroundStyle } from '@/types/customization';

export const MOCK_BACKGROUNDS: BackgroundStyle[] = [
  {
    id: 1,
    attributes: {
      name: "Midnight Fire",
      type: "gradient",
      color_hex: "#1a1a1a",
      text_background_color: "#7f1d1d",
      text_color: "#ffffff",
      preview_image: { data: null },
      sort_order: 1
    }
  },
  {
    id: 2,
    attributes: {
      name: "Cool Ice",
      type: "gradient",
      color_hex: "#1e3a8a",
      text_background_color: "#1e3a8a",
      text_color: "#ffffff",
      preview_image: { data: null },
      sort_order: 2
    }
  },
  {
    id: 3,
    attributes: {
      name: "Forest Green",
      type: "solid_color",
      color_hex: "#065f46",
      text_background_color: "#064e3b",
      text_color: "#ffffff",
      preview_image: { data: null },
      sort_order: 3
    }
  },
  {
    id: 4,
    attributes: {
      name: "Smoke Texture",
      type: "image",
      color_hex: null,
      text_background_color: "#1f2937",
      text_color: "#ffffff",
      preview_image: {
        data: {
          id: 1,
          attributes: {
            url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&h=1200&fit=crop",
            alternativeText: "Smoke texture",
            formats: null
          }
        }
      },
      sort_order: 4
    }
  },
  {
    id: 5,
    attributes: {
      name: "Fire Texture",
      type: "image",
      color_hex: null,
      text_background_color: "#7c2d12",
      text_color: "#ffffff",
      preview_image: {
        data: {
          id: 2,
          attributes: {
            url: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&h=1200&fit=crop",
            alternativeText: "Fire texture",
            formats: null
          }
        }
      },
      sort_order: 5
    }
  },
  {
    id: 6,
    attributes: {
      name: "Light Gray",
      type: "solid_color",
      color_hex: "#f3f4f6",
      text_background_color: "#374151",
      text_color: "#111827",
      preview_image: { data: null },
      sort_order: 6
    }
  },
  {
    id: 7,
    attributes: {
      name: "Sunset Orange",
      type: "gradient",
      color_hex: "#ea580c",
      text_background_color: "#9a3412",
      text_color: "#ffffff",
      preview_image: { data: null },
      sort_order: 7
    }
  },
  {
    id: 8,
    attributes: {
      name: "Purple Dream",
      type: "gradient",
      color_hex: "#7c3aed",
      text_background_color: "#5b21b6",
      text_color: "#ffffff",
      preview_image: { data: null },
      sort_order: 8
    }
  }
];
