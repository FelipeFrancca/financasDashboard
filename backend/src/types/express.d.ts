// Augment Express Request with our custom user type
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      email: string;
    };
  }
}
