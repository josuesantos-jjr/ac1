import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { usePermissionStore } from '../stores';

export const useRolePermissions = () => {
  const { data: session } = useSession();
  const { userRole, permissions, hasPermission, canAccessRoute } = usePermissionStore();

  const rolePermissions = useMemo(() => {
    const role = userRole || session?.user?.role;

    return {
      // Super Admin permissions
      canCreateManagers: role === 'super_admin',
      canCreateClients: ['super_admin', 'manager'].includes(role as string),
      canViewGlobalDashboard: role === 'super_admin',
      canManageSystemSettings: role === 'super_admin',
      canAccessNeuralNetwork: role === 'super_admin',
      canUseTimeTravel: role === 'super_admin',
      canExecuteGlobalBoosts: role === 'super_admin',
      canMonitorSystemNeural: role === 'super_admin',

      // Manager permissions
      canAccessManagerDashboard: ['super_admin', 'manager'].includes(role as string),
      canCreateClientsInPortfolio: role === 'manager',
      canViewMorningRitual: role === 'manager',
      canManageClientJourney: role === 'manager',
      canAccessRelationshipPulse: role === 'manager',
      canImpersonateClients: ['super_admin', 'manager'].includes(role as string),

      // Client permissions
      canAccessClientDashboard: role === 'client',
      canViewAIPulse: role === 'client',
      canSwitchPipelineViews: role === 'client',
      canAccessAssetsVault: role === 'client',
      canTakeOverConversations: role === 'client',
      canViewForecastHorizon: role === 'client',

      // Shared permissions
      canViewOwnProfile: !!role,
      canChangePassword: !!role,
      canLogout: !!role,

      // Utility functions
      hasPermission,
      canAccessRoute,
      currentRole: role,
      isAuthenticated: !!session,
    };
  }, [session, userRole, permissions, hasPermission, canAccessRoute]);

  return rolePermissions;
};