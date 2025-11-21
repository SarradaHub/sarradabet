import { IBusinessService, PaginationParams, PaginatedResult } from "../interfaces/IService";
import { NotFoundError } from "../errors/AppError";
import { IRepository } from "../interfaces/IRepository";

export abstract class BaseService<T, CreateInput, UpdateInput>
  implements IBusinessService<T, CreateInput, UpdateInput>
{
  constructor(
    protected readonly repository: IRepository<T, CreateInput, UpdateInput>,
  ) {}

  abstract findAll(params?: PaginationParams): Promise<PaginatedResult<T>>;
  abstract findById(id: number): Promise<T>;
  abstract create(data: CreateInput): Promise<T>;
  abstract update(id: number, data: UpdateInput): Promise<T>;
  abstract delete(id: number): Promise<void>;

  // accept an argument to allow subclasses to pass data; ignored by default
   
  async validateBusinessRules(_data?: CreateInput | UpdateInput): Promise<void> {
    // default no-op; override in subclasses
  }

  async executeBusinessLogic(data: T): Promise<T> {
    return data;
  }

  protected async handleNotFound(
    id: number,
    entityName: string,
  ): Promise<void> {
    const exists = await this.repository.findUnique({ id } as unknown as Parameters<typeof this.repository.findUnique>[0]);
    if (!exists) {
      throw new NotFoundError(entityName, id);
    }
  }

  protected validateId(id: number): void {
    if (!id || id <= 0 || !Number.isInteger(id)) {
      throw new Error("Invalid ID provided");
    }
  }
}
