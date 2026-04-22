import { create } from 'zustand';
import { api, tokenStorage, getErrorMessage } from '@/lib/api';
import type {
  AuthResponse,
  MeResponse,
  User,
  UserRole,
  DoctorProfile,
  PatientProfile,
} from '@/types';

interface AuthState {
  user: User | null;
  doctor: DoctorProfile | null;
  patient: PatientProfile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  registerPatient: (data: Record<string, unknown>) => Promise<User>;
  registerDoctor: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  doctor: null,
  patient: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    const token = tokenStorage.get();
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const { data } = await api.get<MeResponse>('/auth/me');
      set({
        user: data.user,
        doctor: data.user.doctor ?? null,
        patient: data.user.patient ?? null,
        initialized: true,
      });
    } catch {
      tokenStorage.clear();
      set({ user: null, doctor: null, patient: null, initialized: true });
    }
  },

  login: async (email, password, role) => {
    set({ loading: true });
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
        ...(role ? { role } : {}),
      });
      tokenStorage.set(data.token);
      // Fetch full profile with doctor/patient nested
      const { data: meData } = await api.get<MeResponse>('/auth/me');
      set({
        user: meData.user,
        doctor: meData.user.doctor ?? null,
        patient: meData.user.patient ?? null,
        loading: false,
      });
      return meData.user;
    } catch (err) {
      set({ loading: false });
      throw new Error(getErrorMessage(err));
    }
  },

  registerPatient: async (payload) => {
    set({ loading: true });
    try {
      const { data } = await api.post<AuthResponse>('/auth/register/patient', payload);
      tokenStorage.set(data.token);
      const { data: meData } = await api.get<MeResponse>('/auth/me');
      set({
        user: meData.user,
        doctor: meData.user.doctor ?? null,
        patient: meData.user.patient ?? null,
        loading: false,
      });
      return meData.user;
    } catch (err) {
      set({ loading: false });
      throw new Error(getErrorMessage(err));
    }
  },

  registerDoctor: async (payload) => {
    set({ loading: true });
    try {
      await api.post('/auth/register/doctor', payload);
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw new Error(getErrorMessage(err));
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    tokenStorage.clear();
    set({ user: null, doctor: null, patient: null });
  },

  refresh: async () => {
    try {
      const { data } = await api.get<MeResponse>('/auth/me');
      set({
        user: data.user,
        doctor: data.user.doctor ?? null,
        patient: data.user.patient ?? null,
      });
    } catch {
      // ignore
    }
  },
}));
