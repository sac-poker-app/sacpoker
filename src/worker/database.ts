export interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_KEY: string;
  MOCHA_USERS_SERVICE_API_URL: string;
}

export class DatabaseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export async function executeQuery<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await db.prepare(query).bind(...params).all();
    return result.results as T[];
  } catch (error) {
    throw new DatabaseError(`Database query failed: ${query}`, error);
  }
}

export async function executeQueryFirst<T = any>(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const result = await db.prepare(query).bind(...params).first();
    return result as T | null;
  } catch (error) {
    throw new DatabaseError(`Database query failed: ${query}`, error);
  }
}

export async function executeInsert(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<{ id: number; changes: number }> {
  try {
    const result = await db.prepare(query).bind(...params).run();
    return {
      id: result.meta.last_row_id as number,
      changes: result.meta.changes
    };
  } catch (error) {
    throw new DatabaseError(`Database insert failed: ${query}`, error);
  }
}

export async function executeUpdate(
  db: D1Database,
  query: string,
  params: any[] = []
): Promise<{ changes: number }> {
  try {
    const result = await db.prepare(query).bind(...params).run();
    return {
      changes: result.meta.changes
    };
  } catch (error) {
    throw new DatabaseError(`Database update failed: ${query}`, error);
  }
}
