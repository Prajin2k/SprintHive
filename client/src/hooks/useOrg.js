import { useSelector } from 'react-redux';
import {
  selectMyOrgs,
  selectActiveOrg,
  selectUserOrgRole,
  selectOrgLoading,
  selectOrgMembersLoading,
  selectPendingInvites,
  selectHasOrgs,
} from '../store/slices/orgSlice';

/**
 * Hook: useOrg
 * The foundation for every org-scoped page going forward.
 * Returns the active org, the current user's role in it, and all orgs.
 *
 * Usage:
 *   const { activeOrg, userOrgRole, isOwner, isManagerOrAbove } = useOrg();
 *
 * Role helpers avoid string comparisons scattered across components.
 */
const useOrg = () => {
  const myOrgs = useSelector(selectMyOrgs);
  const activeOrg = useSelector(selectActiveOrg);
  const userOrgRole = useSelector(selectUserOrgRole);
  const isLoading = useSelector(selectOrgLoading);
  const isMembersLoading = useSelector(selectOrgMembersLoading);
  const pendingInvites = useSelector(selectPendingInvites);
  const hasOrgs = useSelector(selectHasOrgs);

  // ── Role helpers (used by every UI permission check) ──────────
  const isOwner = userOrgRole === 'owner';
  const isManagerOrAbove = ['owner', 'manager'].includes(userOrgRole);
  const isTeamLeadOrAbove = ['owner', 'manager', 'teamlead'].includes(userOrgRole);
  const isDeveloperOrAbove = ['owner', 'manager', 'teamlead', 'developer'].includes(userOrgRole);
  const canManageMembers = isManagerOrAbove; // owner + manager can remove members and change roles
  const canInviteMembers = isManagerOrAbove; // owner + manager can invite

  return {
    myOrgs,
    activeOrg,
    userOrgRole,
    isLoading,
    isMembersLoading,
    pendingInvites,
    hasOrgs,
    // Role helpers
    isOwner,
    isManagerOrAbove,
    isTeamLeadOrAbove,
    isDeveloperOrAbove,
    canManageMembers,
    canInviteMembers,
  };
};

export default useOrg;
export { useOrg };  // named export alias for components using destructured import
