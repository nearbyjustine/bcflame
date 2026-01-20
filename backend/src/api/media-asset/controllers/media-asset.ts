/**
 * media-asset controller
 */

import { factories } from '@strapi/strapi';
import { canAccessMedia, getMediaAccessStatus } from '../services/media-access';

export default factories.createCoreController('api::media-asset.media-asset' as any, ({ strapi }) => ({
  // Override find to filter assets based on payment status for resellers
  async find(ctx) {
    const user = ctx.state.user;

    // Check if user has access to media
    if (user) {
      const userRole = user.userType || 'reseller';
      const hasAccess = await canAccessMedia(strapi, user.id, userRole);

      // If reseller doesn't have access, return empty array
      if (!hasAccess && userRole !== 'admin') {
        return {
          data: [],
          meta: {
            pagination: {
              page: 1,
              pageSize: 25,
              pageCount: 0,
              total: 0,
            },
          },
        };
      }
    }

    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Get media access status for current user
  async accessStatus(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const userRole = user.userType || 'reseller';
    const status = await getMediaAccessStatus(strapi, user.id, userRole);

    return {
      data: status,
    };
  },

  // Custom download endpoint to track download counts
  async download(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    // Check if user has access to media
    if (user) {
      const userRole = user.userType || 'reseller';
      const hasAccess = await canAccessMedia(strapi, user.id, userRole);

      if (!hasAccess && userRole !== 'admin') {
        return ctx.forbidden('You must have at least one paid order to download media assets');
      }
    }

    try {
      // Find the media asset
      const entity: any = await strapi.entityService.findOne('api::media-asset.media-asset' as any, id, {
        populate: ['file'],
      });

      if (!entity) {
        return ctx.notFound('Media asset not found');
      }

      // Increment download count
      await strapi.entityService.update('api::media-asset.media-asset' as any, id, {
        data: {
          downloadCount: (entity.downloadCount || 0) + 1,
        } as any,
      });

      // Return file URL
      const file = entity.file;
      if (!file) {
        return ctx.notFound('File not found');
      }

      return {
        data: {
          id: entity.id,
          title: entity.title,
          downloadCount: (entity.downloadCount || 0) + 1,
          file: {
            url: file.url,
            name: file.name,
            mime: file.mime,
            size: file.size,
          },
        },
      };
    } catch (error) {
      ctx.throw(500, error);
    }
  },
}));
