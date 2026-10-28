export default {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/items',
      handler: 'recycleBin.find',
      config: { policies: ['admin::isAuthenticatedAdmin'] },
    },
    {
      method: 'POST',
      path: '/items/:id/restore',
      handler: 'recycleBin.restore',
      config: { policies: ['admin::isAuthenticatedAdmin'] },
    },
    {
      method: 'DELETE',
      path: '/items/:id',
      handler: 'recycleBin.purge',
      config: { policies: ['admin::isAuthenticatedAdmin'] },
    },
  ],
};
