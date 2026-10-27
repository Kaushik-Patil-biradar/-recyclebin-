import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async capture(uid: string, documentId: string, userContext?: any) {
    const config = strapi.config.get('plugin::recycle-bin') as { excludedUids?: string[] };
    if (config?.excludedUids?.includes(uid)) return;

    let entries = await strapi.documents(uid as any).findMany({
      filters: { documentId },
      populate: '*',
      status: 'draft',
    });

    if (!entries || entries.length === 0) {
      entries = await strapi.documents(uid as any).findMany({
        filters: { documentId },
        populate: '*',
      });
    }

    if (!entries || entries.length === 0) return;

    const mainEntry = entries[0];
    const title =
      mainEntry.title ||
      mainEntry.name ||
      mainEntry.subject ||
      mainEntry.documentId ||
      'Untitled Record';

    await strapi.db.query('plugin::recycle-bin.recycle-bin-item').create({
      data: {
        entityUid: uid,
        recordDocumentId: documentId,
        title,
        payload: entries,
        deletedBy: userContext?.id || null,
        deletedAt: new Date(),
      },
    });
  },
});
