// lib/store/auth.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, User } from '../db/schema';
import { verifyPassword } from '../db/seed';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (nisNip: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (nisNip, password) => {
        try {
          const user = await db.users.where('nisNip').equals(nisNip).first();
          if (!user) {
            return { success: false, message: 'NIS/NIP tidak ditemukan' };
          }
          if (!user.aktif) {
            return { success: false, message: 'Akun tidak aktif' };
          }
          if (!verifyPassword(password, user.passwordHash)) {
            return { success: false, message: 'Password salah' };
          }
          set({ user, isAuthenticated: true });
          return { success: true, message: 'Login berhasil' };
        } catch (err) {
          return { success: false, message: 'Terjadi kesalahan: ' + (err as Error).message };
        }
      },
      logout: () => set({ user: null, isAuthenticated: false }),
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'sandeq-auth',
    }
  )
);