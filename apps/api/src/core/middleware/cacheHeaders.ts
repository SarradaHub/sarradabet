import { Request, Response, NextFunction } from "express";

type CacheHeaderOptions = {
  maxAge: number;
  staleWhileRevalidate?: number;
};

export function cacheHeaders(options: CacheHeaderOptions) {
  const { maxAge, staleWhileRevalidate = 0 } = options;

  return (_req: Request, res: Response, next: NextFunction) => {
    const directives = [`public`, `max-age=${maxAge}`];
    if (staleWhileRevalidate > 0) {
      directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
    }
    res.setHeader("Cache-Control", directives.join(", "));
    next();
  };
}
