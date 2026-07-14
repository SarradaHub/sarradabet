import { Request, Response, NextFunction } from "express";

type CacheHeaderOptions = {
  maxAge: number;
  staleWhileRevalidate?: number;
};

type SetCacheControlOptions = {
  maxAge?: number;
  staleWhileRevalidate?: number;
  noStore?: boolean;
};

export const CATEGORY_LIST_CACHE = {
  maxAge: 300,
  staleWhileRevalidate: 60,
} as const;

export function setCacheControl(
  res: Response,
  options: SetCacheControlOptions,
): void {
  if (options.noStore) {
    res.setHeader("Cache-Control", "no-store");
    return;
  }

  const { maxAge = 0, staleWhileRevalidate = 0 } = options;
  const directives = [`public`, `max-age=${maxAge}`];
  if (staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }
  res.setHeader("Cache-Control", directives.join(", "));
}

export function cacheHeaders(options: CacheHeaderOptions) {
  return (_req: Request, res: Response, next: NextFunction) => {
    setCacheControl(res, options);
    next();
  };
}
