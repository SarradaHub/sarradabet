import { PrismaClient } from "@prisma/client";
import { BaseRepository } from "../BaseRepository";

// Mock Prisma Client
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    test: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

class TestRepository extends BaseRepository<
  Record<string, unknown>,
  unknown,
  unknown
> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findMany(
    params?: Record<string, unknown>,
  ): Promise<Record<string, unknown>[]> {
    return (this.prisma as any).test.findMany(params);
  }

  async findUnique(
    where?: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    return (this.prisma as any).test.findUnique(where ?? { where: { id: 1 } });
  }

  async create(data?: unknown): Promise<Record<string, unknown>> {
    return (this.prisma as any).test.create(data ?? { data: {} });
  }

  async update(
    where?: Record<string, unknown>,
    data?: unknown,
  ): Promise<Record<string, unknown>> {
    return (this.prisma as any).test.update(
      where ?? { where: { id: 1 }, data: {} },
    );
  }

  async delete(
    where?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return (this.prisma as any).test.delete(where ?? { where: { id: 1 } });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return (this.prisma as any).test.count({ where });
  }
}

describe("BaseRepository", () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let repository: TestRepository;

  beforeEach(() => {
    mockPrisma = {
      test: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<PrismaClient>;

    repository = new TestRepository(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findManyWithPagination", () => {
    it("should return paginated results", async () => {
      const mockData = [{ id: 1 }, { id: 2 }];
      (mockPrisma as any).test.findMany.mockResolvedValueOnce(mockData);
      (mockPrisma as any).test.count.mockResolvedValueOnce(25);

      const result = await repository.findManyWithPagination(
        {
          page: 2,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        {} as any,
      );

      expect(result).toEqual({
        data: mockData,
        meta: {
          page: 2,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: true,
        },
      });

      expect((mockPrisma as any).test.findMany).toHaveBeenCalledTimes(1);
      const callArgs = (mockPrisma as any).test.findMany.mock.calls[0][0];
      expect(callArgs).toEqual(
        expect.objectContaining({
          skip: 10,
          take: 10,
          orderBy: { createdAt: "desc" },
        }),
      );
    });

    it("should handle first page correctly", async () => {
      const mockData = [{ id: 1 }];
      (mockPrisma as any).test.findMany.mockResolvedValueOnce(mockData);
      (mockPrisma as any).test.count.mockResolvedValueOnce(5);

      const result = await repository.findManyWithPagination(
        {
          page: 1,
          limit: 10,
        },
        {} as any,
      );

      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
    });
  });

  describe("executeTransaction", () => {
    it("should execute transaction callback", async () => {
      const mockResult = { id: 1 };
      const mockCallback = jest.fn().mockResolvedValue(mockResult);
      mockPrisma.$transaction.mockResolvedValue(mockResult);

      const result = await repository.executeTransaction(mockCallback);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(mockCallback);
      expect(result).toBe(mockResult);
    });
  });
});
