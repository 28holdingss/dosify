import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Returns the authenticated user's id, resolved from the Better Auth session
 * by the middleware in `src/index.ts`. Throws a 401 when not signed in.
 */
export function resolveUserId(c: Context<any>): string {
  const userId = c.get('userId') as string | null;
  if (!userId) {
    throw new HTTPException(401, { message: 'Not authenticated' });
  }
  return userId;
}
