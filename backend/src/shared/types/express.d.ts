declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        role: 'developer' | 'manager' | 'admin';
        organizationId?: string | null;
      };
    }
  }
}

export {};
