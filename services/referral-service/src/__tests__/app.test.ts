import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../db.js';
import { env } from '../env.js';

// Mock Prisma
vi.mock('../db.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    referralCode: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock environment
vi.mock('../env.js', () => ({
  env: {
    NODE_ENV: 'test',
    HOST: '0.0.0.0',
    PORT: 8787,
    DATABASE_URL: 'file::memory:',
    API_KEYS: 'test-api-key',
    RATE_LIMIT_WINDOW_MS: 60000,
    RATE_LIMIT_MAX: 120,
    RATE_LIMIT_WRITE_MAX: 20,
    CHAIN_ID: 1,
    RPC_URL: undefined,
    ONCHAIN_REFERRAL_REGISTRY_ADDRESS: undefined,
    SYNC_POLL_INTERVAL_MS: 30000,
    SYNC_CONFIRMATIONS: 3,
    SYNC_START_BLOCK: undefined,
    apiKeys: new Set(['test-api-key']),
  },
}));

describe('Referral Service API', () => {
  let app: any;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with ok:true when DB is healthy', async () => {
      (prisma.$queryRaw as any).mockResolvedValueOnce([{ '?column?': 1 }]);

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        service: 'referral-service',
        env: 'test',
        timestamp: expect.any(String),
      });
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should return 503 when DB fails', async () => {
      (prisma.$queryRaw as any).mockRejectedValueOnce(new Error('DB connection failed'));

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        ok: false,
        service: 'referral-service',
        error: 'DB connection failed',
      });
    });
  });

  describe('POST /v1/codes', () => {
    it('should create code with auto-generated code when not provided', async () => {
      const mockCode = {
        code: 'ABC12345',
        referrerAddress: '0x1234567890123456789012345678901234567890',
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(null);
      (prisma.referralCode.create as any).mockResolvedValueOnce(mockCode);

      const response = await request(app)
        .post('/v1/codes')
        .set('x-api-key', 'test-api-key')
        .send({
          referrerAddress: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        code: mockCode.code,
        referrerAddress: mockCode.referrerAddress,
        status: mockCode.status,
        createdAt: mockCode.createdAt.toISOString(),
      });
    });

    it('should create code with provided code', async () => {
      const mockCode = {
        code: 'MYCODE123',
        referrerAddress: '0x1234567890123456789012345678901234567890',
        status: 'ACTIVE',
        createdAt: new Date(),
      };

      (prisma.referralCode.create as any).mockResolvedValueOnce(mockCode);

      const response = await request(app)
        .post('/v1/codes')
        .set('x-api-key', 'test-api-key')
        .send({
          code: 'MYCODE123',
          referrerAddress: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body.code).toBe('MYCODE123');
    });

    it('should return 401 when API key is missing', async () => {
      const response = await request(app).post('/v1/codes').send({
        referrerAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'unauthorized',
        message: 'Valid x-api-key is required.',
      });
    });

    it('should return 401 when API key is wrong', async () => {
      const response = await request(app)
        .post('/v1/codes')
        .set('x-api-key', 'wrong-key')
        .send({
          referrerAddress: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'unauthorized',
        message: 'Valid x-api-key is required.',
      });
    });

    it('should return 400 on invalid payload (missing referrerAddress)', async () => {
      const response = await request(app)
        .post('/v1/codes')
        .set('x-api-key', 'test-api-key')
        .send({
          code: 'TEST123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('validation_error');
    });

    it('should return 409 on duplicate code', async () => {
      const { Prisma } = await import('@prisma/client');
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '6.8.2',
        }
      );

      (prisma.referralCode.create as any).mockRejectedValueOnce(prismaError);

      const response = await request(app)
        .post('/v1/codes')
        .set('x-api-key', 'test-api-key')
        .send({
          code: 'DUPLICATE',
          referrerAddress: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'code_exists',
        message: 'Referral code already exists.',
      });
    });
  });

  describe('GET /v1/codes/:code/resolve', () => {
    it('should resolve active code successfully', async () => {
      const mockCode = {
        code: 'ACTIVE123',
        referrerAddress: '0x1234567890123456789012345678901234567890',
        status: 'ACTIVE',
      };

      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(mockCode);
      (prisma.referralCode.update as any).mockResolvedValueOnce({ ...mockCode, lastResolvedAt: new Date() });

      const response = await request(app).get('/v1/codes/ACTIVE123/resolve');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: mockCode.code,
        referrerAddress: mockCode.referrerAddress,
        status: mockCode.status,
      });
    });

    it('should return 404 for non-existent code', async () => {
      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(null);

      const response = await request(app).get('/v1/codes/NONEXISTENT/resolve');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'request_error',
        message: 'Referral code not found.',
      });
    });

    it('should return 404 for revoked code', async () => {
      const mockCode = {
        code: 'REVOKED123',
        referrerAddress: '0x1234567890123456789012345678901234567890',
        status: 'REVOKED',
      };

      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(mockCode);

      const response = await request(app).get('/v1/codes/REVOKED123/resolve');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'request_error',
        message: 'Referral code not found.',
      });
    });
  });

  describe('GET /v1/referrers/:referrerAddress/codes', () => {
    it('should list all codes for referrer with valid API key', async () => {
      const now = new Date();
      const mockCodes = [
        {
          code: 'CODE1',
          referrerAddress: '0x1234567890123456789012345678901234567890',
          status: 'ACTIVE',
          createdAt: now,
          revokedAt: null,
          revokedReason: null,
          metadata: null,
        },
        {
          code: 'CODE2',
          referrerAddress: '0x1234567890123456789012345678901234567890',
          status: 'REVOKED',
          createdAt: now,
          revokedAt: now,
          revokedReason: 'test',
          metadata: null,
        },
      ];

      (prisma.referralCode.findMany as any).mockResolvedValueOnce(mockCodes);

      const response = await request(app)
        .get('/v1/referrers/0x1234567890123456789012345678901234567890/codes')
        .set('x-api-key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.referrerAddress).toBe('0x1234567890123456789012345678901234567890');
      expect(response.body.status).toBe('all');
      expect(response.body.count).toBe(2);
      expect(response.body.codes).toHaveLength(2);
      expect(response.body.codes[0].code).toBe('CODE1');
      expect(response.body.codes[1].code).toBe('CODE2');
    });

    it('should filter by active status', async () => {
      const mockCodes = [
        {
          code: 'ACTIVE1',
          referrerAddress: '0x1234567890123456789012345678901234567890',
          status: 'ACTIVE',
          createdAt: new Date(),
          revokedAt: null,
          revokedReason: null,
          metadata: null,
        },
      ];

      (prisma.referralCode.findMany as any).mockResolvedValueOnce(mockCodes);

      const response = await request(app)
        .get('/v1/referrers/0x1234567890123456789012345678901234567890/codes?status=active')
        .set('x-api-key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('active');
    });

    it('should return 401 without API key', async () => {
      const response = await request(app).get('/v1/referrers/0x1234567890123456789012345678901234567890/codes');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'unauthorized',
        message: 'Valid x-api-key is required.',
      });
    });
  });

  describe('POST /v1/codes/:code/revoke', () => {
    it('should revoke code successfully', async () => {
      const existingCode = {
        code: 'TOREVOKE',
        referrerAddress: '0x1234567890123456789012345678901234567890',
        status: 'ACTIVE',
      };

      const updatedCode = {
        code: 'TOREVOKE',
        status: 'REVOKED',
        revokedAt: new Date(),
        revokedReason: 'admin_action',
      };

      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(existingCode);
      (prisma.referralCode.update as any).mockResolvedValueOnce(updatedCode);

      const response = await request(app)
        .post('/v1/codes/TOREVOKE/revoke')
        .set('x-api-key', 'test-api-key')
        .send({ reason: 'admin_action' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        code: updatedCode.code,
        status: updatedCode.status,
        revokedAt: updatedCode.revokedAt.toISOString(),
        revokedReason: updatedCode.revokedReason,
      });
    });

    it('should return 404 for non-existent code', async () => {
      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/v1/codes/NONEXISTENT/revoke')
        .set('x-api-key', 'test-api-key');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'request_error',
        message: 'Referral code not found.',
      });
    });

    it('should return 409 if code already revoked', async () => {
      const existingCode = {
        code: 'ALREADYREVOKED',
        referrerAddress: '0x1234567890123456789012345678901234567890',
        status: 'REVOKED',
      };

      (prisma.referralCode.findUnique as any).mockResolvedValueOnce(existingCode);

      const response = await request(app)
        .post('/v1/codes/ALREADYREVOKED/revoke')
        .set('x-api-key', 'test-api-key');

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'request_error',
        message: 'Referral code already revoked.',
      });
    });

    it('should return 401 without API key', async () => {
      const response = await request(app).post('/v1/codes/SOMECODE/revoke');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'unauthorized',
        message: 'Valid x-api-key is required.',
      });
    });
  });
});