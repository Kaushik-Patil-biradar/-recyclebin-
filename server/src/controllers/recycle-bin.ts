import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async find(ctx: any) {
    const { page = 1, pageSize = 10, search, entityUid } = ctx.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSizeNum = Math.max(1, Math.min(100, parseInt(pageSize as string, 10) || 10));

    const where: any = {};

    if (typeof entityUid === 'string' && entityUid.trim()) {
      where.entityUid = entityUid.trim();
    }

    if (typeof search === 'string' && search.trim()) {
      where.title = { $containsi: search.trim() };
    }

    const [items, total] = await Promise.all([
      strapi.db.query('plugin::recycle-bin.recycle-bin-item').findMany({
        where,
        populate: ['deletedBy'],
        orderBy: { deletedAt: 'desc' },
        offset: (pageNum - 1) * pageSizeNum,
        limit: pageSizeNum,
      }),
      strapi.db.query('plugin::recycle-bin.recycle-bin-item').count({ where }),
    ]);

    ctx.body = {
      data: items,
      meta: {
        pagination: {
          page: pageNum,
          pageSize: pageSizeNum,
          pageCount: Math.ceil(total / pageSizeNum) || 1,
          total,
        },
      },
    };
  },

  async restore(ctx: any) {
    const { id } = ctx.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId) || numericId <= 0) {
      return ctx.badRequest('Invalid or missing item ID');
    }

    try {
      await strapi.plugin('recycle-bin').service('restore').restoreItem(numericId);
      ctx.body = { data: { restored: true } };
    } catch (err: any) {
      if (err.message?.includes('not found')) {
        return ctx.notFound(err.message);
      }
      return ctx.badRequest(err.message || 'Failed to restore item');
    }
  },

  async purge(ctx: any) {
    const { id } = ctx.params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId) || numericId <= 0) {
      return ctx.badRequest('Invalid or missing item ID');
    }

    try {
      await strapi.plugin('recycle-bin').service('restore').purgeItem(numericId);
      ctx.body = { data: { purged: true } };
    } catch (err: any) {
      return ctx.badRequest(err.message || 'Failed to purge item');
    }
  },
});
