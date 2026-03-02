import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Creates Express middleware that validates request data against a Zod schema.
 * On success, replaces the target with parsed (and typed) data.
 * On failure, returns 400 with detailed error messages.
 */
export function validate(schema: z.ZodType, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
      return;
    }

    // Replace with parsed data (coerced types, defaults applied)
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
