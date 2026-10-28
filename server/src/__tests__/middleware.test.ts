import { registerDeletionMiddleware } from '../middlewares/intercept-deletion';

describe('Intercept Deletion Middleware', () => {
  let mockStrapi: any;
  let registeredMiddleware: (context: any, next: () => Promise<any>) => Promise<any>;
  let mockArchiveService: any;

  beforeEach(() => {
    mockArchiveService = {
      capture: jest.fn().mockResolvedValue(undefined),
    };

    mockStrapi = {
      documents: {
        use: jest.fn((fn) => {
          registeredMiddleware = fn;
        }),
      },
      plugin: jest.fn().mockReturnValue({
        service: jest.fn().mockReturnValue(mockArchiveService),
      }),
      requestContext: {
        get: jest.fn().mockReturnValue({
          state: {
            user: { id: 7, email: 'admin@strapi.io' },
          },
        }),
      },
      log: {
        error: jest.fn(),
      },
    };

    registerDeletionMiddleware(mockStrapi);
  });

  it('should register middleware on strapi.documents', () => {
    expect(mockStrapi.documents.use).toHaveBeenCalled();
    expect(typeof registeredMiddleware).toBe('function');
  });

  it('should bypass archiving for non-delete actions and call next()', async () => {
    const next = jest.fn().mockResolvedValue('created-doc');
    const context = { action: 'create', uid: 'api::test.test', params: { data: {} } };

    const result = await registeredMiddleware(context, next);

    expect(mockArchiveService.capture).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(result).toBe('created-doc');
  });

  it('should capture document snapshot when action is delete and call next()', async () => {
    const next = jest.fn().mockResolvedValue({ count: 1 });
    const context = {
      action: 'delete',
      uid: 'api::post.post',
      params: { documentId: 'post_123' },
    };

    const result = await registeredMiddleware(context, next);

    expect(mockArchiveService.capture).toHaveBeenCalledWith(
      'api::post.post',
      'post_123',
      { id: 7, email: 'admin@strapi.io' }
    );
    expect(next).toHaveBeenCalled();
    expect(result).toEqual({ count: 1 });
  });

  it('should catch capture error, log it, and still allow deletion to proceed via next()', async () => {
    mockArchiveService.capture.mockRejectedValue(new Error('DB capture failed'));

    const next = jest.fn().mockResolvedValue({ count: 1 });
    const context = {
      action: 'delete',
      uid: 'api::post.post',
      params: { documentId: 'post_123' },
    };

    const result = await registeredMiddleware(context, next);

    expect(mockStrapi.log.error).toHaveBeenCalledWith(
      expect.stringContaining('[recycle-bin] Archiving failed for api::post.post (post_123):'),
      expect.any(Error)
    );
    expect(next).toHaveBeenCalled();
    expect(result).toEqual({ count: 1 });
  });
});
