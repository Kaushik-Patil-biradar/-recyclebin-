import restoreFactory from '../services/restore';

describe('Restore Service', () => {
  let mockStrapi: any;
  let restoreService: ReturnType<typeof restoreFactory>;
  let mockDbQuery: any;

  beforeEach(() => {
    mockDbQuery = {
      findOne: jest.fn(),
      delete: jest.fn().mockResolvedValue({ id: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    };

    mockStrapi = {
      db: {
        query: jest.fn().mockReturnValue(mockDbQuery),
      },
      contentType: jest.fn(),
      documents: jest.fn(),
    };

    restoreService = restoreFactory({ strapi: mockStrapi });
  });

  describe('restoreItem', () => {
    it('should throw an error if item is not found in recycle bin', async () => {
      mockDbQuery.findOne.mockResolvedValue(null);

      await expect(restoreService.restoreItem(999)).rejects.toThrow(
        'Item not found in recycle bin'
      );
    });

    it('should throw an error if target content type no longer exists in Strapi', async () => {
      mockDbQuery.findOne.mockResolvedValue({
        id: 1,
        entityUid: 'api::deleted-type.deleted-type',
        payload: [{ title: 'Ghost' }],
      });
      mockStrapi.contentType.mockReturnValue(null);

      await expect(restoreService.restoreItem(1)).rejects.toThrow(
        'Target content type api::deleted-type.deleted-type no longer exists.'
      );
    });

    it('should restore document with draftAndPublish and delete from recycle bin', async () => {
      mockDbQuery.findOne.mockResolvedValue({
        id: 5,
        entityUid: 'api::article.article',
        recordDocumentId: 'doc123',
        payload: [
          {
            id: 10,
            documentId: 'doc123',
            title: 'My Article',
            content: 'Hello World',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-02',
            publishedAt: '2026-01-02',
          },
        ],
      });

      mockStrapi.contentType.mockReturnValue({
        options: { draftAndPublish: true },
      });

      const mockCreate = jest.fn().mockResolvedValue({ documentId: 'doc123' });
      mockStrapi.documents.mockReturnValue({ create: mockCreate });

      const result = await restoreService.restoreItem(5);

      expect(result).toEqual({ success: true });
      expect(mockStrapi.documents).toHaveBeenCalledWith('api::article.article');
      expect(mockCreate).toHaveBeenCalledWith({
        documentId: 'doc123',
        data: {
          title: 'My Article',
          content: 'Hello World',
        },
        status: 'published',
      });

      expect(mockDbQuery.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('should restore document without status if draftAndPublish is disabled', async () => {
      mockDbQuery.findOne.mockResolvedValue({
        id: 7,
        entityUid: 'api::setting.setting',
        recordDocumentId: 'doc_setting',
        payload: {
          id: 20,
          documentId: 'doc_setting',
          key: 'site_name',
          value: 'My Site',
          createdAt: '2026-01-01',
        },
      });

      mockStrapi.contentType.mockReturnValue({
        options: { draftAndPublish: false },
      });

      const mockCreate = jest.fn().mockResolvedValue({ documentId: 'doc_setting' });
      mockStrapi.documents.mockReturnValue({ create: mockCreate });

      await restoreService.restoreItem(7);

      expect(mockCreate).toHaveBeenCalledWith({
        documentId: 'doc_setting',
        data: {
          key: 'site_name',
          value: 'My Site',
        },
      });
      expect(mockDbQuery.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });

  describe('purgeItem', () => {
    it('should permanently delete item from recycle-bin-item table', async () => {
      await restoreService.purgeItem(15);

      expect(mockStrapi.db.query).toHaveBeenCalledWith('plugin::recycle-bin.recycle-bin-item');
      expect(mockDbQuery.delete).toHaveBeenCalledWith({ where: { id: 15 } });
    });
  });

  describe('restoreMany', () => {
    it('should restore multiple items successfully', async () => {
      mockDbQuery.findOne.mockResolvedValue({
        id: 1,
        entityUid: 'api::article.article',
        recordDocumentId: 'doc1',
        payload: [{ title: 'Item' }],
      });
      mockStrapi.contentType.mockReturnValue({ options: {} });
      mockStrapi.documents.mockReturnValue({ create: jest.fn().mockResolvedValue({}) });

      const result = await restoreService.restoreMany([1, 2]);

      expect(result.success).toBe(true);
      expect(result.count).toBe(2);
      expect(result.restored).toEqual([1, 2]);
    });

    it('should track errors if an item fails to restore', async () => {
      mockDbQuery.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 2,
          entityUid: 'api::article.article',
          recordDocumentId: 'doc2',
          payload: [{ title: 'Item 2' }],
        });
      mockStrapi.contentType.mockReturnValue({ options: {} });
      mockStrapi.documents.mockReturnValue({ create: jest.fn().mockResolvedValue({}) });

      const result = await restoreService.restoreMany([1, 2]);

      expect(result.success).toBe(false);
      expect(result.count).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].id).toBe(1);
    });
  });

  describe('purgeMany', () => {
    it('should delete multiple items by id', async () => {
      const result = await restoreService.purgeMany([1, 2]);

      expect(mockDbQuery.deleteMany).toHaveBeenCalledWith({ where: { id: { $in: [1, 2] } } });
      expect(result).toEqual({ success: true, count: 2 });
    });

    it('should return 0 count if empty ids array is passed', async () => {
      const result = await restoreService.purgeMany([]);

      expect(result).toEqual({ success: true, count: 0 });
    });
  });
});
