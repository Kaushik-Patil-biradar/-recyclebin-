export default {
  default: {
    retentionDays: 30,
    excludedUids: [
      'admin::user',
      'admin::permission',
      'admin::role',
      'admin::api-token',
      'admin::transfer-token',
      'plugin::recycle-bin.recycle-bin-item',
      'plugin::upload.file',
    ],
  },
  validator() {},
};