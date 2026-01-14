import { strapiApi } from './strapi';
import type {
  BudStyle,
  BackgroundStyle,
  FontStyle,
  PreBaggingOption,
  CustomizationSelections,
  OrderInquiry,
  BudStylesResponse,
  BackgroundStylesResponse,
  FontStylesResponse,
  PreBaggingOptionsResponse,
  OrderInquiriesResponse,
  SingleOrderInquiryResponse,
} from '@/types/customization';

/**
 * Fetch all bud style options (trim quality, flower grades, visual styles)
 */
export async function getBudStyles(): Promise<BudStyle[]> {
  const response = await strapiApi.get<BudStylesResponse>('/api/bud-styles', {
    params: {
      sort: 'sort_order:asc',
      populate: '*',
    },
  });
  return response.data.data;
}

/**
 * Fetch all background style options (colors, gradients, textures)
 */
export async function getBackgroundStyles(): Promise<BackgroundStyle[]> {
  const response = await strapiApi.get<BackgroundStylesResponse>('/api/background-styles', {
    params: {
      sort: 'sort_order:asc',
      populate: '*',
    },
  });
  return response.data.data;
}

/**
 * Fetch all font style options (typography choices for packaging)
 */
export async function getFontStyles(): Promise<FontStyle[]> {
  const response = await strapiApi.get<FontStylesResponse>('/api/font-styles', {
    params: {
      sort: 'sort_order:asc',
      populate: '*',
    },
  });
  return response.data.data;
}

/**
 * Fetch all pre-bagging packaging options
 */
export async function getPreBaggingOptions(): Promise<PreBaggingOption[]> {
  const response = await strapiApi.get<PreBaggingOptionsResponse>('/api/prebagging-options', {
    params: {
      sort: 'sort_order:asc',
      populate: '*',
    },
  });
  return response.data.data;
}

/**
 * Submit a new order inquiry with customization selections
 *
 * @param productId - The ID of the product being customized
 * @param selections - The customization selections made by the user
 * @param notes - Optional additional notes or special requests
 * @returns The created order inquiry with auto-generated inquiry number
 */
export async function submitOrderInquiry(
  productId: number,
  selections: CustomizationSelections,
  notes?: string
): Promise<OrderInquiry> {
  // Calculate total weight from pre-bagging selections (quantity × unit_size)
  const totalWeight = selections.preBagging.reduce((sum, selection) => {
    return sum + (selection.quantity * selection.unitSize);
  }, 0);

  // Determine weight unit from selections (use first selection's unit or default to 'lb')
  const weightUnit = selections.preBagging[0]?.unitSizeUnit || 'lb';

  // DEBUG: Check if JWT cookie exists
  const Cookies = (await import('js-cookie')).default;
  const jwt = Cookies.get('jwt');
  console.log('🔍 DEBUG: JWT cookie exists:', !!jwt);
  console.log('🔍 DEBUG: JWT value:', jwt?.substring(0, 20) + '...');

  const response = await strapiApi.post<SingleOrderInquiryResponse>('/api/order-inquiries', {
    data: {
      product: productId,
      selected_photos: selections.photos,
      selected_bud_styles: selections.budStyles,
      selected_backgrounds: selections.backgrounds,
      selected_fonts: selections.fonts,
      selected_prebagging: selections.preBagging.map((s) => ({
        option_id: s.optionId,
        quantity: s.quantity,
        unit_size: s.unitSize,
        unit_size_unit: s.unitSizeUnit,
        custom_text: s.customText,
      })),
      total_weight: totalWeight > 0 ? totalWeight : 0,
      weight_unit: weightUnit,
      notes,
    },
  });
  return response.data.data;
}

/**
 * Fetch all order inquiries for the authenticated user
 */
export async function getMyOrderInquiries(): Promise<OrderInquiry[]> {
  const response = await strapiApi.get<OrderInquiriesResponse>('/api/order-inquiries', {
    params: {
      populate: ['product', 'product.images', 'customer'],
      sort: 'createdAt:desc',
    },
  });
  return response.data.data;
}

/**
 * Fetch a single order inquiry by ID
 */
export async function getOrderInquiryById(id: number): Promise<OrderInquiry> {
  const response = await strapiApi.get<SingleOrderInquiryResponse>(`/api/order-inquiries/${id}`, {
    params: {
      populate: ['product', 'customer', 'reviewed_by'],
    },
  });
  return response.data.data;
}

/**
 * Submit multiple order inquiries in a batch
 *
 * @param inquiries - Array of order inquiry data
 * @returns Response with created inquiries and metadata including inquiry numbers
 */
export async function submitBatchOrderInquiries(
  inquiries: Array<{
    product: number;
    selected_photos: number[];
    selected_bud_styles: number[];
    selected_backgrounds: number[];
    selected_fonts: number[];
    selected_prebagging: number[];
    total_weight: number;
    weight_unit: string;
    notes?: string;
  }>
): Promise<{
  data: OrderInquiry[];
  meta: {
    inquiry_numbers: string[];
    total: number;
  };
}> {
  const response = await strapiApi.post('/api/order-inquiries/batch', {
    inquiries,
  });
  return response.data;
}
