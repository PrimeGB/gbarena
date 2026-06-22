export type AppUser = {
  id: string;
  email?: string | null;
};

export function useUser(): { user: AppUser | null; loading: boolean };
