export class PaginationUtil {
  static buildPagination(
    total: number,
    page: number,
    limit: number,
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    return {
      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),
    };
  }
}
