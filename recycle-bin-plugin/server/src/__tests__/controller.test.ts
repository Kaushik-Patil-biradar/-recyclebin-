import controllerFactory from '../controllers/recycle-bin';

describe('Recycle Bin Controller', () => {
  let mockStrapi: any;
  let controller: ReturnType<typeof controllerFactory>;
  let mockDbQuery: any;
  let mockRestoreService: any;

  beforeEach(() => {
    mockDbQuery = {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, title: 'Deleted Item 1', entityUid: 'api::article.article' },
      ]),
      count: jest.fn().mockResolvedValue(1),
    };

    mockRestoreService = {
      restoreItem: jest.fn().mockResolvedValue({ success: true }),
      purgeItem: jest.fn().mockResolvedValue({ id: 1 }),
    };

    mockStrapi = {
      db: {
        query: jest.fn().mockReturnValue(mockDbQuery),
      },
      plugin: jest.fn().mockReturnValue({
        service: jest.fn().mockReturnValue(mockRestoreService),
      }),
    };

    controller = controllerFactory({ strapi: mockStrapi });
  });

  describe('find', () => {
    it('should return items with default pagination', async () => {
      const ctx: any = { query: {} };
      await controller.find(ctx);

      expect(mockDbQuery.findMany).toHaveBeenCalledWith({
        where: {},
        populate: ['deletedBy'],
        orderBy: { deletedAt: 'desc' },
        offset: 0,
        limit: 10,
      });

      expect(ctx.body).toEqual({
        data: [{ id: 1, title: 'Deleted Item 1', entityUid: 'api::article.article' }],
        meta: {
          pagination: {
            page: 1,
            pageSize: 10,
            pageCount: 1,
            total: 1,
          },
        },
      });
    });

    it('should sanitize and clamp pageSize to maximum 100', async () => {
      const ctx: any = { query: { page: '2', pageSize: '500' } };
      await controller.find(ctx);

      expect(mockDbQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 100, // (2 - 1) * 100
          limit: 100,
        })
      );
      expect(ctx.body.meta.pagination.pageSize).toBe(100);
    });

    it('should apply sanitized search and entityUid filters', async () => {
      const ctx: any = {
        query: { search: '  keyword  ', entityUid: 'api::blog.blog' },
      };
      await controller.find(ctx);

      expect(mockDbQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            entityUid: 'api::blog.blog',
            title: { $containsi: 'keyword' },
          },
        })
      );
    });

    it('should ignore non-string search input to prevent query manipulation', async () => {
      const ctx: any = {
        query: { search: { $gt: '' }, entityUid: ['invalid'] },
      };
      await controller.find(ctx);

      expect(mockDbQuery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  });

  describe('restore', () => {
    it('should restore item successfully with valid numeric ID', async () => {
      const ctx: any = {
        params: { id: '5' },
        body: null,
      };

      await controller.restore(ctx);

      expect(mockRestoreService.restoreItem).toHaveBeenCalledWith(5);
      expect(ctx.body).toEqual({ data: { restored: true } });
    });

    it('should return badRequest on invalid ID', async () => {
      const ctx: any = {
        params: { id: 'abc' },
        badRequest: jest.fn(),
      };

      await controller.restore(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('Invalid or missing item ID');
      expect(mockRestoreService.restoreItem).not.toHaveBeenCalled();
    });

    it('should return notFound when restoreService throws not found error', async () => {
      mockRestoreService.restoreItem.mockRejectedValue(
        new Error('Item not found in recycle bin')
      );

      const ctx: any = {
        params: { id: '10' },
        notFound: jest.fn(),
      };

      await controller.restore(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('Item not found in recycle bin');
    });
  });

  describe('purge', () => {
    it('should purge item successfully with valid ID', async () => {
      const ctx: any = {
        params: { id: '3' },
        body: null,
      };

      await controller.purge(ctx);

      expect(mockRestoreService.purgeItem).toHaveBeenCalledWith(3);
      expect(ctx.body).toEqual({ data: { purged: true } });
    });

    it('should return badRequest on invalid ID', async () => {
      const ctx: any = {
        params: { id: '-1' },
        badRequest: jest.fn(),
      };

      await controller.purge(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('Invalid or missing item ID');
      expect(mockRestoreService.purgeItem).not.toHaveBeenCalled();
    });
  });
});
