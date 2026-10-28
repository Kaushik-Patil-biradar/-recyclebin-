import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async restoreItem(id: number) {
    const item = await strapi.db.query('plugin::recycle-bin.recycle-bin-item').findOne({
      where: { id },
    });
    if (!item) {
      throw new Error('Item not found in recycle bin');
    }
    const { entityUid, payload } = item;
    const model = strapi.contentType(entityUid as any);
    if (!model) {
      throw new Error(`Target content type ${entityUid} no longer exists.`);
    }
    const records = Array.isArray(payload) ? payload : [payload];
    for (const record of records) {
      const sanitizedData = { ...record };
      delete sanitizedData.id;
      delete sanitizedData.documentId;
      delete sanitizedData.createdAt;
      delete sanitizedData.updatedAt;
      delete sanitizedData.publishedAt;

      const createParams: any = { data: sanitizedData };
      if (model.options?.draftAndPublish) {
        createParams.status = record.publishedAt ? 'published' : 'draft';
      }

      await strapi.documents(entityUid as any).create(createParams);
    }
    await strapi.db.query('plugin::recycle-bin.recycle-bin-item').delete({
      where: { id },
    });
    return { success: true };
  },
  async purgeItem(id: number) {
    return strapi.db.query('plugin::recycle-bin.recycle-bin-item').delete({
      where: { id },
    });
  },
});
