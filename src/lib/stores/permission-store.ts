import { create } from 'zustand';

interface PermissionState {
  userRole: 'super_admin' | 'manager' | 'client' | null;
  permissions: string[];
  setUserRole: (role: 'super_admin' | 'manager' | 'client' | null) => void;
  setPermissions: (permissions: string[]) => void;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  userRole: null,
  permissions: [],

  setUserRole: (role) => set({ userRole: role }),

  setPermissions: (permissions) => set({ permissions }),

  hasPermission: (permission) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  canAccessRoute: (route) => {
    const { userRole } = get();

    if (!userRole) return false;

    if (route.startsWith('/admin')) {
      return userRole === 'super_admin';
    }

    if (route.startsWith('/manager')) {
      return ['super_admin', 'manager'].includes(userRole);
    }

    if (route.startsWith('/client')) {
      return userRole === 'client';
    }

    return true; // Public routes
  },
}));