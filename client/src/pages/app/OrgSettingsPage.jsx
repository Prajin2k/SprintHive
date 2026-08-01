import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Users, Mail, AlertTriangle, UserPlus, Trash2, Shield } from 'lucide-react';

import useOrg from '../../hooks/useOrg';
import useAuth from '../../hooks/useAuth';
import {
  fetchOrgDetails,
  inviteMember,
  removeMember,
  updateMemberRole,
  deleteOrganization,
  fetchPendingInvites,
  revokeInvite,
} from '../../store/slices/orgSlice';
import { useNavigate } from 'react-router-dom';

const INVITE_ROLES = ['manager', 'teamlead', 'developer', 'tester'];
const ROLE_LABELS = {
  owner: { label: 'Owner', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  manager: { label: 'Manager', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  teamlead: { label: 'Team Lead', color: 'text-brand-400 bg-brand-400/10 border-brand-400/20' },
  developer: { label: 'Developer', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  tester: { label: 'Tester', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
};

const inviteSchema = z.object({
  email: z.string().email('Valid email required'),
  role: z.enum(['manager', 'teamlead', 'developer', 'tester']),
});

// ── Role badge ──────────────────────────────────────────────────
function RoleBadge({ role }) {
  const { label, color } = ROLE_LABELS[role] || { label: role, color: 'text-surface-400 bg-surface-700 border-surface-600' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize ${color}`}>
      {label}
    </span>
  );
}

// ── Member row ──────────────────────────────────────────────────
function MemberRow({ member, isOwner, currentUserId, orgId, onRemove, onRoleChange }) {
  const user = member.user;
  const userId = user?._id || user;
  const isCurrentUser = userId === currentUserId;
  const isOrgOwner = member.role === 'owner';
  const [changingRole, setChangingRole] = useState(false);

  const handleRoleChange = async (e) => {
    setChangingRole(true);
    await onRoleChange(userId, e.target.value);
    setChangingRole(false);
  };

  return (
    <div className="flex items-center gap-3 py-3.5 border-b border-surface-600/60 last:border-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-sm font-bold text-brand-300 flex-shrink-0 overflow-hidden">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          user?.initials || '?'
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {user?.name || 'Unknown'}
          {isCurrentUser && <span className="ml-1.5 text-xs text-surface-400 font-normal">(you)</span>}
        </p>
        <p className="text-xs text-surface-400 truncate">{user?.email}</p>
      </div>

      {/* Role */}
      <div className="flex items-center gap-2">
        {isOwner && !isOrgOwner && !isCurrentUser ? (
          <select
            value={member.role}
            onChange={handleRoleChange}
            disabled={changingRole}
            className="text-xs bg-surface-800 border border-surface-600 rounded-lg px-2.5 py-1 text-surface-200 focus:outline-none focus:border-brand-500 cursor-pointer"
          >
            {INVITE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r].label}
              </option>
            ))}
          </select>
        ) : (
          <RoleBadge role={member.role} />
        )}
      </div>

      {/* Remove button */}
      {isOwner && !isOrgOwner && !isCurrentUser && (
        <button
          onClick={() => onRemove(userId)}
          className="text-surface-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors ml-1"
          title="Remove member"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────
const TABS = ['Members', 'Invites', 'Danger Zone'];

function TabButton({ active, onClick, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all relative ${
        active ? 'bg-surface-700 text-white border border-surface-600' : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
      }`}
    >
      {label}
      {badge > 0 && (
        <span className="ml-2 px-1.5 py-0.2 rounded-full bg-brand-500 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function OrgSettingsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    activeOrg,
    userOrgRole,
    isOwner,
    canInviteMembers,
    isMembersLoading,
    pendingInvites,
  } = useOrg();
  const [activeTab, setActiveTab] = useState('Members');
  const [inviting, setInviting] = useState(false);
  const [deletingOrgConfirm, setDeletingOrgConfirm] = useState('');
  const [deletingOrg, setDeletingOrg] = useState(false);

  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?._id || currentUser?.id;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(inviteSchema), defaultValues: { role: 'developer' } });

  useEffect(() => {
    if (activeOrg?._id) {
      dispatch(fetchOrgDetails(activeOrg._id));
      if (canInviteMembers) {
        dispatch(fetchPendingInvites(activeOrg._id));
      }
    }
  }, [activeOrg?._id, dispatch, canInviteMembers]);

  const handleInvite = async (data) => {
    setInviting(true);
    const result = await dispatch(inviteMember({ orgId: activeOrg._id, ...data }));
    setInviting(false);

    if (inviteMember.fulfilled.match(result)) {
      toast.success(result.payload.message);
      reset();
      if (!result.payload.addedUser) {
        dispatch(fetchPendingInvites(activeOrg._id));
      } else {
        dispatch(fetchOrgDetails(activeOrg._id));
      }
    } else {
      toast.error(result.payload?.message || 'Invite failed');
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member from the organization?')) return;
    const result = await dispatch(removeMember({ orgId: activeOrg._id, userId }));
    if (removeMember.fulfilled.match(result)) toast.success('Member removed');
    else toast.error(result.payload?.message || 'Failed to remove');
  };

  const handleRoleChange = async (userId, role) => {
    const result = await dispatch(updateMemberRole({ orgId: activeOrg._id, userId, role }));
    if (updateMemberRole.fulfilled.match(result)) toast.success('Role updated');
    else toast.error(result.payload?.message || 'Failed to update role');
  };

  const handleRevoke = async (inviteId) => {
    const result = await dispatch(revokeInvite({ orgId: activeOrg._id, inviteId }));
    if (revokeInvite.fulfilled.match(result)) toast.success('Invite revoked');
    else toast.error(result.payload?.message || 'Failed to revoke');
  };

  const handleDeleteOrg = async () => {
    if (deletingOrgConfirm !== activeOrg?.name) {
      toast.error('Organization name does not match');
      return;
    }
    setDeletingOrg(true);
    const result = await dispatch(deleteOrganization(activeOrg._id));
    setDeletingOrg(false);
    if (deleteOrganization.fulfilled.match(result)) {
      toast.success(result.payload.message || 'Organization deleted');
      navigate('/app');
    } else {
      toast.error(result.payload?.message || 'Failed to delete');
    }
  };

  if (!activeOrg) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-surface-400">
        <Users size={32} className="mb-2 text-surface-600" />
        <p>No active organization selected.</p>
      </div>
    );
  }

  const members = activeOrg?.members || [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Organization Settings</h1>
        <p className="text-surface-300 text-sm">
          <span className="text-white font-medium">{activeOrg.name}</span>
          {' · '}
          <span className="capitalize">{userOrgRole}</span>
          {' · '}
          {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 bg-surface-800 rounded-2xl w-fit border border-surface-600">
        {TABS.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            badge={tab === 'Invites' ? pendingInvites.length : 0}
          />
        ))}
      </div>

      {/* ── Members Tab ─────────────────────────────────────── */}
      {activeTab === 'Members' && (
        <div className="card animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-brand-400" />
            <h2 className="text-base font-bold text-white">
              Members ({members.length})
            </h2>
          </div>

          {isMembersLoading ? (
            <div className="flex items-center justify-center py-8 text-surface-400">
              <div className="spinner-sm mr-2" />
              Loading members...
            </div>
          ) : (
            <div>
              {members.map((m, i) => (
                <MemberRow
                  key={m.user?._id || i}
                  member={m}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                  orgId={activeOrg._id}
                  onRemove={handleRemove}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </div>
          )}

          {/* Invite form */}
          {canInviteMembers && (
            <form onSubmit={handleSubmit(handleInvite)} className="mt-6 pt-6 border-t border-surface-600">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-brand-400" /> Invite a Member
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    {...register('email')}
                  />
                  {errors.email && <p className="error-msg">{errors.email.message}</p>}
                </div>
                <div className="w-full sm:w-36">
                  <select
                    id="invite-role"
                    className="input"
                    {...register('role')}
                  >
                    {INVITE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r].label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  id="invite-submit"
                  type="submit"
                  disabled={inviting}
                  className="btn-primary flex-shrink-0"
                >
                  {inviting ? <span className="spinner-sm" /> : 'Send Invite'}
                </button>
              </div>
              <p className="text-xs text-surface-400 mt-2.5">
                If the email isn't registered, they'll receive a sign-up link. Expires in 7 days.
              </p>
            </form>
          )}
        </div>
      )}

      {/* ── Invites Tab ─────────────────────────────────────── */}
      {activeTab === 'Invites' && (
        <div className="card animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={18} className="text-brand-400" />
            <h2 className="text-base font-bold text-white">
              Pending Invitations ({pendingInvites.length})
            </h2>
          </div>
          {pendingInvites.length === 0 ? (
            <p className="text-surface-400 text-sm py-6 text-center">No pending invitations.</p>
          ) : (
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite._id}
                  className="flex items-center gap-3 py-3 border-b border-surface-600 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{invite.email}</p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      <RoleBadge role={invite.role} /> · Invited by{' '}
                      {invite.invitedBy?.name || 'Unknown'} ·{' '}
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  {canInviteMembers && (
                    <button
                      onClick={() => handleRevoke(invite._id)}
                      className="text-xs text-surface-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Danger Zone Tab ─────────────────────────────────── */}
      {activeTab === 'Danger Zone' && (
        <div className="card border-red-500/30 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="text-base font-bold text-red-400">Delete Organization</h2>
          </div>
          <p className="text-surface-300 text-sm mb-6 leading-relaxed">
            This will soft-delete the organization and archive all its projects. Data is preserved
            but the org will be inaccessible. This action requires owner privileges.
          </p>

          {!isOwner ? (
            <p className="text-surface-400 text-sm">Only the owner can delete this organization.</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label text-surface-300">
                  Type <span className="text-white font-mono bg-surface-800 px-1.5 py-0.5 rounded">{activeOrg.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deletingOrgConfirm}
                  onChange={(e) => setDeletingOrgConfirm(e.target.value)}
                  placeholder={activeOrg.name}
                  className="input"
                  id="delete-org-confirm"
                />
              </div>
              <button
                id="delete-org-btn"
                onClick={handleDeleteOrg}
                disabled={deletingOrg || deletingOrgConfirm !== activeOrg.name}
                className="btn-danger"
              >
                {deletingOrg ? (
                  <span className="flex items-center gap-2">
                    <span className="spinner-sm" />
                    Deleting…
                  </span>
                ) : (
                  'Delete Organization'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
