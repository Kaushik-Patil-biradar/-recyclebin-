import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async restoreItem(id: number) {
    const item = await strapi.db.query('plugin::recycle-bin.recycle-bin-item').findOne({
      where: { id },
    });
    if (!item) {
      throw new Error('Item not found in recycle bin');
    }
    const { entityUid, payload, recordDocumentId } = item;
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

      const createParams: any = {
        data: sanitizedData,
      };

      if (recordDocumentId) {
        createParams.documentId = recordDocumentId;
      }

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

  async restoreMany(ids: number[]) {
    const restored: number[] = [];
    const errors: { id: number; message: string }[] = [];

    for (const id of ids) {
      try {
        await this.restoreItem(id);
        restored.push(id);
      } catch (err: any) {
        errors.push({ id, message: err.message || 'Failed to restore' });
      }
    }

    return {
      success: errors.length === 0,
      count: restored.length,
      restored,
      errors,
    };
  },

  async purgeMany(ids: number[]) {
    if (!ids || ids.length === 0) {
      return { success: true, count: 0 };
    }

    await strapi.db.query('plugin::recycle-bin.recycle-bin-item').deleteMany({
      where: { id: { $in: ids } },
    });

    return { success: true, count: ids.length };
  },
});
