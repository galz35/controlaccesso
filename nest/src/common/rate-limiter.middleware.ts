import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

const store = new Map<string, { count: number; resetAt: number }>();

// Limpiar entradas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 300000);

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const now = Date.now();
    let entry = store.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 1, resetAt: now + 60000 };
      store.set(ip, entry);
      res.setHeader('X-RateLimit-Limit', '60');
      res.setHeader('X-RateLimit-Remaining', '59');
      next();
      return;
    }

    entry.count++;
    res.setHeader('X-RateLimit-Limit', '60');
    res.setHeader('X-RateLimit-Remaining', Math.max(0, 60 - entry.count));

    if (entry.count > 60) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Demasiadas solicitudes. Intente de nuevo en unos segundos.',
        retryAfter,
      });
      return;
    }

    next();
  }
}