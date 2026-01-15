/**
 * campaign-kit controller
 */

import { factories } from '@strapi/strapi';
import archiver from 'archiver';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs';

export default factories.createCoreController('api::campaign-kit.campaign-kit' as any, ({ strapi }) => ({
  // Custom download endpoint to create zip of selected assets
  async download(ctx) {
    const { id } = ctx.params;
    const { assetIds } = ctx.request.body || {};

    try {
      // Find the campaign kit with assets
      const entity: any = await strapi.entityService.findOne('api::campaign-kit.campaign-kit' as any, id, {
        populate: {
          assets: {
            populate: ['file'],
          },
        },
      });

      if (!entity) {
        return ctx.notFound('Campaign kit not found');
      }

      // Filter assets if specific IDs are provided
      let assetsToDownload = entity.assets || [];
      if (assetIds && Array.isArray(assetIds) && assetIds.length > 0) {
        assetsToDownload = assetsToDownload.filter((asset: any) => 
          assetIds.includes(asset.id)
        );
      }

      if (assetsToDownload.length === 0) {
        return ctx.badRequest('No assets to download');
      }

      // Create zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      // Set response headers
      const sanitizedName = entity.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      ctx.set('Content-Type', 'application/zip');
      ctx.set('Content-Disposition', `attachment; filename="${sanitizedName}_campaign_kit.zip"`);

      // Pipe archive to response
      ctx.body = archive;

      // Add files to archive
      for (const asset of assetsToDownload) {
        if (asset.file) {
          const file = asset.file;
          const fileUrl = file.url;
          
          // For local files
          if (fileUrl.startsWith('/uploads/')) {
            const filePath = path.join(strapi.dirs.static.public, fileUrl);
            if (fs.existsSync(filePath)) {
              archive.file(filePath, { name: file.name });
            }
          } else {
            // For external URLs (S3, etc.), we'd need to fetch the file
            // This is a simplified version - in production, you'd want to stream from the URL
            try {
              const response = await fetch(fileUrl);
              if (response.ok) {
                const buffer = await response.arrayBuffer();
                archive.append(Buffer.from(buffer), { name: file.name });
              }
            } catch (fetchError) {
              console.error(`Failed to fetch file: ${fileUrl}`, fetchError);
            }
          }

          // Increment download count for each asset
          await strapi.entityService.update('api::media-asset.media-asset' as any, asset.id, {
            data: {
              downloadCount: (asset.downloadCount || 0) + 1,
            } as any,
          });
        }
      }

      // Finalize archive
      await archive.finalize();

      return ctx.body;
    } catch (error) {
      console.error('Campaign kit download error:', error);
      ctx.throw(500, error);
    }
  },
}));
