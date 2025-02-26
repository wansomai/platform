import 'next-auth';

declare module 'next-auth' {
  interface User {
    avatar?: string;
    fullName?: string;
    role?: string;
    organization?: {
      id: string;
      name: string;
    };
  }
} 