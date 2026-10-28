import type { Core } from '@strapi/strapi';

export const registerDeletionMiddleware = (strapi: Core.Strapi) => {
  strapi.documents.use(async (context, next): Promise<any> => {
    if (context.action === 'delete') {
      const uid = context.uid;
      const documentId = context.params?.documentId;
      const auth = (strapi as any).requestContext?.get()?.state?.user;
      if (uid && documentId) {
        try {
          await strapi.plugin('recycle-bin').service('archive').capture(uid, documentId, auth);
        } catch (err) {
          strapi.log.error(`[recycle-bin] Archiving failed for ${uid} (${documentId}):`, err);
        }
      }
    }
    return next();
  });
};
