import { getServiceClient } from './supabase-server';

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function getUserFromRequest(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new AuthError('Missing Authorization header', 'UNAUTHORIZED');
  }

  const {
    data: { user },
    error,
  } = await getServiceClient().auth.getUser(token);

  if (error || !user) {
    throw new AuthError('Invalid or expired token', 'UNAUTHORIZED');
  }

  return user.id;
}
