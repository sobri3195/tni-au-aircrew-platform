import { useLocation } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import type { AppAction } from '../utils/rbac';
import { hasActionAccess, hasRouteAccess, hasRouteWriteAccess } from '../utils/rbac';

export const useRoleAccess = () => {
  const { state } = useApp();
  const location = useLocation();

  return {
    role: state.role,
    canViewCurrentRoute: hasRouteAccess(state.role, location.pathname),
    canWriteCurrentRoute: hasRouteWriteAccess(state.role, location.pathname),
    canViewRoute: (path: string) => hasRouteAccess(state.role, path),
    canWriteRoute: (path: string) => hasRouteWriteAccess(state.role, path),
    canDoAction: (action: AppAction) => hasActionAccess(state.role, action)
  };
};
