/**
 * inventory router
 * 
 * Note: Route permissions are managed via the Strapi admin panel.
 * Go to Settings > Users & Permissions > Roles to configure access.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::inventory.inventory');
