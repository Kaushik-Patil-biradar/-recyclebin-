import archiveFactory from '../services/archive';

describe('Archive Service', () => {
  let mockStrapi: any;
  let archiveService: ReturnType<typeof archiveFactory>;

  beforeEach(() => {
    mockStrapi = {
      config: {
        get: jest.fn().mockReturnValue({
          excludedUids: ['admin::user', 'plugin::recycle-bin.recycle-bin-item'],
        }),
      },
      documents: jest.fn(),
      db: {
        query: jest.fn().mockReturnValue({
          create: jest.fn().mockResolvedValue({ id: 1 }),
        }),
      },
    };

    archiveService = archiveFactory({ strapi: mockStrapi });
  });

  it('should ignore excluded UIDs and not capture document', async () => {
    await archiveService.capture('admin::user', 'doc123');

    expect(mockStrapi.documents).not.toHaveBeenCalled();
    expect(mockStrapi.db.query).not.toHaveBeenCalled();
  });

  it('should capture draft entry and save snapshot to recycle-bin-item', async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { id: 10, documentId: 'doc123', title: 'Test Article', publishedAt: null },
    ]);
    mockStrapi.documents.mockReturnValue({ findMany: mockFindMany });

    await archiveService.capture('api::article.article', 'doc123', { id: 42 });

    expect(mockFindMany).toHaveBeenCalledWith({
      filters: { documentId: 'doc123' },
      populate: '*',
      status: 'draft',
    });

    expect(mockStrapi.db.query).toHaveBeenCalledWith('plugin::recycle-bin.recycle-bin-item');
    const createMock = mockStrapi.db.query().create;
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entityUid: 'api::article.article',
          recordDocumentId: 'doc123',
          title: 'Test Article',
          deletedBy: 42,
          payload: [expect.objectContaining({ documentId: 'doc123', title: 'Test Article' })],
        }),
      })
    );
  });

  it('should fallback to non-draft findMany if draft findMany returns empty', async () => {
    const mockFindMany = jest
      .fn()
      .mockResolvedValueOnce([]) // status: 'draft' returns empty
      .mockResolvedValueOnce([   // non-draft fallback returns entry
        { id: 11, documentId: 'doc456', name: 'My Category' },
      ]);
    mockStrapi.documents.mockReturnValue({ findMany: mockFindMany });

    await archiveService.capture('api::category.category', 'doc456');

    expect(mockFindMany).toHaveBeenCalledTimes(2);
    expect(mockFindMany).toHaveBeenNthCalledWith(2, {
      filters: { documentId: 'doc456' },
      populate: '*',
    });

    const createMock = mockStrapi.db.query().create;
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'My Category',
          deletedBy: null,
        }),
      })
    );
  });

  it('should fallback to documentId or Untitled Record if no title/name/subject exists', async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { id: 12, documentId: 'doc789' },
    ]);
    mockStrapi.documents.mockReturnValue({ findMany: mockFindMany });

    await archiveService.capture('api::item.item', 'doc789');

    const createMock = mockStrapi.db.query().create;
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'doc789',
        }),
      })
    );
  });

  it('should not create recycle item if document entries do not exist', async () => {
    const mockFindMany = jest.fn().mockResolvedValue([]);
    mockStrapi.documents.mockReturnValue({ findMany: mockFindMany });

    await archiveService.capture('api::item.item', 'non-existent-doc');

    expect(mockStrapi.db.query).not.toHaveBeenCalled();
  });
});
