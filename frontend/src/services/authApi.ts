import { apiClient } from '@/services/apiClient';
import type { AuthResult, PublicUser } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResult>('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResult>('/auth/register', { name, email, password }),

  profile: () => apiClient.get<PublicUser>('/auth/profile'),
};
