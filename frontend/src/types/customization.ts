import type { StrapiImage } from './product';

export interface BudStyle {
  id: number;
  attributes: {
    name: string;
    category: 'trim_quality' | 'flower_grade' | 'visual_style';
    description?: string;
    image?: { data: StrapiImage | null };
    sort_order: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
}

export interface BackgroundStyle {
  id: number;
  attributes: {
    name: string;
    type: 'solid_color' | 'gradient' | 'texture' | 'image';
    color_hex?: string;
    preview_image?: { data: StrapiImage | null };
    sort_order: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
}

export interface FontStyle {
  id: number;
  attributes: {
    name: string;
    font_family: string;
    category: 'sans_serif' | 'serif' | 'display' | 'script';
    preview_image?: { data: StrapiImage | null };
    sort_order: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
}

export interface PreBaggingOption {
  id: number;
  attributes: {
    name: string;
    packaging_type: 'mylar_bag' | 'glass_jar' | 'preroll_tube' | 'child_resistant_container' | 'tin_container';
    description?: string;
    available_weights: string[];
    unit_size: number;
    unit_size_unit: string;
    image?: { data: StrapiImage | null };
    sort_order: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
  };
}

export interface SelectionLimit {
  id: number;
  option_type: 'photos' | 'bud_styles' | 'backgrounds' | 'fonts' | 'prebagging';
  min_selections: number;
  max_selections: number;
}

export interface PhotoOption {
  id: number;
  name: string;
  url: string;
  formats: {
    thumbnail?: { url: string; width: number; height: number };
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
  };
}

export interface PreBaggingSelection {
  optionId: number;
  quantity: number;
  unitSize: number;
  unitSizeUnit: string;
  customText?: string;
}

export interface CustomizationSelections {
  photos: number[];
  budStyles: number[];
  backgrounds: number[];
  fonts: number[];
  preBagging: PreBaggingSelection[];
}

export interface OrderInquiry {
  id: number;
  attributes: {
    inquiry_number: string;
    status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed';
    product?: {
      data?: {
        id: number;
        attributes: {
          name: string;
          sku?: string;
          category: string;
          images?: {
            data: Array<{
              id: number;
              attributes: {
                url: string;
                alternativeText?: string;
              };
            }>;
          };
        };
      };
    };
    customer?: {
      data: {
        id: number;
        attributes: {
          username: string;
          email: string;
        };
      };
    };
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    selections?: {
      photos?: number[];
      budStyles?: number[];
      backgrounds?: number[];
      fonts?: number[];
      preBagging?: PreBaggingSelection[];
    };
    selected_photos?: number[];
    selected_bud_styles?: number[];
    selected_backgrounds?: number[];
    selected_fonts?: number[];
    selected_prebagging?: PreBaggingSelection[];
    additional_notes?: string;
    notes?: string;
    reviewed_at?: string;
    reviewed_by?: {
      data: {
        id: number;
        attributes: {
          firstname: string;
          lastname: string;
        };
      } | null;
    };
    createdAt: string;
    updatedAt: string;
  };
}

export interface OrderInquiriesResponse {
  data: OrderInquiry[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface SingleOrderInquiryResponse {
  data: OrderInquiry;
  meta: {};
}

export interface BudStylesResponse {
  data: BudStyle[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface BackgroundStylesResponse {
  data: BackgroundStyle[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface FontStylesResponse {
  data: FontStyle[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface PreBaggingOptionsResponse {
  data: PreBaggingOption[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}
