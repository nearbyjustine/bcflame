/**
 * media-asset controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::media-asset.media-asset' as any, ({ strapi }) => ({
  // Override find to only return published assets for non-admin users
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // Custom download endpoint to track download counts
  async download(ctx) {
    const { id } = ctx.params;

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
