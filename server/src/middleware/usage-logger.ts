// Usage Statistics Logger Middleware
import type { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';

const db = new Database('./trailcamp.db');

// Prepare insert statement
const insertUsage = db.prepare(`
  INSERT INTO usage_stats (
    endpoint, method, query_params, response_time_ms, 
    status_code, user_agent, ip_address
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

export function usageLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Capture original end function
  const originalEnd = res.end;
  
  // Override end to log after response
  res.end = function(...args: any[]) {
    const responseTime = Date.now() - startTime;
    
    // Log to database (async, don't block response)
    setImmediate(() => {
      try {
        const queryParams = Object.keys(req.query).length > 0 
          ? JSON.stringify(req.query) 
          : null;
        
        insertUsage.run(
          req.path,
          req.method,
          queryParams,
          responseTime,
          res.statusCode,
          req.get('user-agent') || null,
          req.ip || null
        );
      } catch (err) {
        console.error('Failed to log usage:', err);
      }
    });
    
    // Call original end
    return originalEnd.apply(res, args);
  };
  
  next();
}
