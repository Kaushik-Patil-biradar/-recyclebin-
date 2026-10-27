import type { Core } from "@strapi/strapi";
import { registerDeletionMiddleware } from "./middlewares/intercept-deletion";
const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  // bootstrap phase
  registerDeletionMiddleware(strapi);
  strapi.cron.add({
    recycleBinRetentionJob:{
      task:async()=>{
        const config=strapi.config.get('plugin::recycle-bin') as {retentionDays: number};
        const days=config.retentionDays||30;
        const cutoff=new Date(Date.now()-days*24*60*60*1000);
        const deleted=await strapi.db.query('plugin::recycle-bin.recycle-bin-item').deleteMany({
          where: {
            deletedAt: { $lt: cutoff },
          },
      });
      strapi.log.info(`[recycle-bin] Auto-purged ${deleted.count} expired item(s).`)
    },
    options: {
        rule: '0 0 * * *', // Midnight
      },
    }
  })
};

export default bootstrap;