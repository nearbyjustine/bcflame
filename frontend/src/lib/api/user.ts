import { strapiApi } from './strapi';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  reseller_logo?: {
    id: number;
    url: string;
    name: string;
    formats?: any;
  };
}

/**
 * Get authenticated user's profile with reseller logo
 */
export async function getUserProfile(): Promise<UserProfile> {
  const response = await strapiApi.get('/api/users/me', {
    params: {
      populate: 'reseller_logo',
    },
  });
  return response.data;
}

/**
 * Upload user's reseller logo and update profile
 *
 * @param file - Image file (PNG, JPG, SVG)
 * @returns Updated user profile with new logo
 */
export async function uploadUserLogo(file: File): Promise<UserProfile> {
  // Step 1: Upload file to Strapi media library
  const formData = new FormData();
  formData.append('files', file);

  const uploadResponse = await strapiApi.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const uploadedFile = uploadResponse.data[0];

  // Step 2: Update user profile with logo ID
  const updateResponse = await strapiApi.put('/api/users/me', {
    reseller_logo: uploadedFile.id,
  });

  return updateResponse.data;
}

/**
 * Remove user's reseller logo from profile
 */
export async function removeUserLogo(): Promise<UserProfile> {
  const response = await strapiApi.put('/api/users/me', {
    reseller_logo: null,
  });
  return response.data;
}
