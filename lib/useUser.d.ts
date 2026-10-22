export type AppUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

export function useUser(): { user: AppUser | null; loading: boolean };
