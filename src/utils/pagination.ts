export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const normalizePositiveNumber = (
  value: number | string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
