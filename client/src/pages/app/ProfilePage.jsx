import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, BriefcaseBusiness, Users, Code2, ShieldCheck, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import logoIcon from '../../assets/logo_icon.png';

import useAuth from '../../hooks/useAuth';
import useOrg from '../../hooks/useOrg';
import {
  updateProfile,
  uploadAvatar,
  changePassword,
  logoutUser,
} from '../../store/slices/authSlice';
import { clearOrgState } from '../../store/slices/orgSlice';

// ── Validation schemas ──────────────────────────────────────────
const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(80),
  timezone: z.string().min(1),
  theme: z.enum(['dark', 'light', 'system']),
  language: z.enum(['en', 'es', 'fr', 'de', 'ja', 'zh']),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must include uppercase')
      .regex(/[a-z]/, 'Must include lowercase')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must differ from current',
    path: ['newPassword'],
  });

// ── Role meta map ───────────────────────────────────────────────
const ROLE_META = {
  owner: {
    label: 'Owner',
    Icon: Crown,
    description: 'You have full administrative control over this organization.',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    iconClass: 'text-purple-400',
    glowColor: 'rgba(168,85,247,0.12)',
  },
  manager: {
    label: 'Manager',
    Icon: BriefcaseBusiness,
    description: 'You can manage projects and organization members.',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    iconClass: 'text-blue-400',
    glowColor: 'rgba(59,130,246,0.10)',
  },
  teamlead: {
    label: 'Team Lead',
    Icon: Users,
    description: 'You coordinate projects, sprints and team tasks.',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    iconClass: 'text-indigo-400',
    glowColor: 'rgba(99,102,241,0.10)',
  },
  developer: {
    label: 'Developer',
    Icon: Code2,
    description: 'You can work on assigned projects, tasks and report bugs.',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    iconClass: 'text-emerald-400',
    glowColor: 'rgba(16,185,129,0.10)',
  },
  tester: {
    label: 'Tester',
    Icon: ShieldCheck,
    description: 'You can verify bugs and help maintain software quality.',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    iconClass: 'text-amber-400',
    glowColor: 'rgba(245,158,11,0.10)',
  },
};

const UNKNOWN_META = {
  label: 'Unknown',
  Icon: HelpCircle,
  description: 'Your role in this organization could not be determined.',
  badgeClass: 'bg-surface-600/60 text-surface-300 border-surface-500/50',
  iconClass: 'text-surface-400',
  glowColor: 'rgba(100,116,139,0.06)',
};

// ── All known permissions (display order) ───────────────────────
const ALL_PERMISSIONS = [
  'Manage Organization',
  'Invite Members',
  'Change Member Roles',
  'Create Projects',
  'Edit Projects',
  'Delete Projects',
  'Manage Sprints',
  'Create Sprints',
  'Manage Tasks',
  'Create Tasks',
  'Assign Tasks',
  'Update Assigned Tasks',
  'Assign Bugs',
  'Report Bugs',
  'Verify Bugs',
  'Upload Files',
  'Comment',
  'View Projects',
  'View Tasks',
  'View Analytics',
];

// Permissions each role is granted
const ROLE_PERMISSIONS = {
  owner: new Set([
    'Manage Organization',
    'Invite Members',
    'Change Member Roles',
    'Create Projects',
    'Edit Projects',
    'Delete Projects',
    'Manage Sprints',
    'Create Sprints',
    'Manage Tasks',
    'Create Tasks',
    'Assign Tasks',
    'Update Assigned Tasks',
    'Assign Bugs',
    'Report Bugs',
    'Verify Bugs',
    'Upload Files',
    'Comment',
    'View Projects',
    'View Tasks',
    'View Analytics',
  ]),
  manager: new Set([
    'Invite Members',
    'Create Projects',
    'Edit Projects',
    'Manage Sprints',
    'Create Sprints',
    'Manage Tasks',
    'Create Tasks',
    'Assign Tasks',
    'Update Assigned Tasks',
    'Assign Bugs',
    'Report Bugs',
    'Verify Bugs',
    'Upload Files',
    'Comment',
    'View Projects',
    'View Tasks',
    'View Analytics',
  ]),
  teamlead: new Set([
    'Create Projects',
    'Edit Projects',
    'Create Sprints',
    'Manage Tasks',
    'Create Tasks',
    'Assign Tasks',
    'Update Assigned Tasks',
    'Report Bugs',
    'Upload Files',
    'Comment',
    'View Projects',
    'View Tasks',
    'View Analytics',
  ]),
  developer: new Set([
    'Update Assigned Tasks',
    'Report Bugs',
    'Upload Files',
    'Comment',
    'View Projects',
    'View Tasks',
  ]),
  tester: new Set([
    'Verify Bugs',
    'Comment',
    'View Projects',
    'View Tasks',
  ]),
};

// ── OrgRoleCard ─────────────────────────────────────────────────
function OrgRoleCard({ role, orgName }) {
  const roleKey = role?.toLowerCase();
  const meta = (roleKey && ROLE_META[roleKey]) || UNKNOWN_META;
  const { Icon, label, description, badgeClass, iconClass, glowColor } = meta;

  return (
    <div
      className="mt-6 rounded-2xl border border-surface-600/60 p-6 transition-all duration-200 hover:border-surface-500/80 hover:-translate-y-0.5 hover:shadow-card"
      style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.72) 0%, rgba(15,23,42,0.55) 100%)',
        boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 6px 28px ${glowColor}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Section label + org name */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">
          Organization Role
        </p>
        {orgName && (
          <span
            className="text-xs text-surface-500 truncate max-w-[180px] bg-surface-700/50 px-2.5 py-1 rounded-lg border border-surface-600/50"
            title={orgName}
          >
            {orgName}
          </span>
        )}
      </div>

      {/* Icon + badge + description */}
      <div className="flex items-start gap-4">
        {/* Icon bubble */}
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border ${badgeClass}`}
          style={{ background: glowColor }}
        >
          <Icon size={22} className={iconClass} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Role pill badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border mb-2.5 ${badgeClass}`}
          >
            <Icon size={13} />
            {label}
          </span>

          {/* Role description */}
          <p className="text-surface-300 text-sm leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── PermissionsCard ──────────────────────────────────────────────
function PermissionsCard({ role }) {
  const roleKey = role?.toLowerCase();
  const granted = (roleKey && ROLE_PERMISSIONS[roleKey]) || new Set();
  const hasRole = roleKey && ROLE_META[roleKey];

  // Partition permissions into granted / denied
  const grantedList = ALL_PERMISSIONS.filter((p) => granted.has(p));
  const deniedList  = ALL_PERMISSIONS.filter((p) => !granted.has(p));

  return (
    <div
      className="mt-4 rounded-2xl border border-surface-600/60 p-6 transition-all duration-200 hover:border-surface-500/80 hover:-translate-y-0.5 hover:shadow-card"
      style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.65) 0%, rgba(15,23,42,0.45) 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">
          Your Permissions
        </p>
        {hasRole && (
          <span className="text-xs text-surface-500">
            · {grantedList.length} of {ALL_PERMISSIONS.length} granted
          </span>
        )}
      </div>

      {!hasRole ? (
        <p className="text-surface-400 text-sm">
          Permissions cannot be displayed for an unknown role.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0">
          {/* Granted */}
          {grantedList.map((perm) => (
            <div
              key={perm}
              className="flex items-center gap-2.5 py-2 border-b border-surface-700/50 last:border-0"
            >
              <CheckCircle2
                size={15}
                className="flex-shrink-0 text-emerald-400"
                strokeWidth={2.2}
              />
              <span className="text-sm text-white/90 font-medium">{perm}</span>
            </div>
          ))}

          {/* Denied */}
          {deniedList.map((perm) => (
            <div
              key={perm}
              className="flex items-center gap-2.5 py-2 border-b border-surface-700/40 last:border-0 opacity-40"
            >
              <XCircle
                size={15}
                className="flex-shrink-0 text-surface-400"
                strokeWidth={2}
              />
              <span className="text-sm text-surface-400 line-through">{perm}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────
function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 ${
        active
          ? 'bg-surface-700 text-white border border-surface-600'
          : 'text-surface-400 hover:text-white hover:bg-surface-800'
      }`}
    >
      {children}
    </button>
  );
}

function FormField({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

// ── Avatar section ──────────────────────────────────────────────
function AvatarSection({ user, onUpload }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('avatar', file);
    setUploading(true);
    try {
      await onUpload(fd);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Upload failed. Try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const avatarSrc = preview || user?.avatar;

  return (
    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-surface-600">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-500/15 border-2 border-brand-500/30 flex items-center justify-center">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-brand-300">
              {user?.initials || '?'}
            </div>
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
            <div className="spinner-sm" />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-white font-bold text-lg mb-0.5">{user?.name}</h3>
        <p className="text-surface-400 text-xs mb-3">{user?.email}</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-secondary btn-sm"
        >
          {uploading ? 'Uploading…' : 'Change Photo'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFile}
          id="avatar-upload"
        />
        <p className="text-xs text-surface-400 mt-2">JPG, PNG, WebP or GIF · Max 5 MB</p>
      </div>
    </div>
  );
}

// ── Profile tab ─────────────────────────────────────────────────
function ProfileTab({ user }) {
  const dispatch = useDispatch();
  const { isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      timezone: user?.timezone || 'UTC',
      theme: user?.theme || 'dark',
      language: user?.language || 'en',
    },
  });

  const onSubmit = async (data) => {
    const result = await dispatch(updateProfile(data));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated!');
    } else {
      toast.error(result.payload?.message || 'Update failed.');
    }
  };

  const handleUpload = async (formData) => {
    const result = await dispatch(uploadAvatar(formData));
    if (!uploadAvatar.fulfilled.match(result)) {
      throw new Error('Upload failed');
    }
  };

  return (
    <div>
      <AvatarSection user={user} onUpload={handleUpload} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Full name" id="profile-name" error={errors.name?.message}>
          <input
            id="profile-name"
            type="text"
            className={`input ${errors.name ? 'input-error' : ''}`}
            {...register('name')}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Theme" id="profile-theme" error={errors.theme?.message}>
            <select id="profile-theme" className="input" {...register('theme')}>
              <option value="dark">🌙 Dark</option>
              <option value="light">☀️ Light</option>
              <option value="system">💻 System</option>
            </select>
          </FormField>

          <FormField label="Language" id="profile-lang" error={errors.language?.message}>
            <select id="profile-lang" className="input" {...register('language')}>
              <option value="en">🇺🇸 English</option>
              <option value="es">🇪🇸 Spanish</option>
              <option value="fr">🇫🇷 French</option>
              <option value="de">🇩🇪 German</option>
              <option value="ja">🇯🇵 Japanese</option>
              <option value="zh">🇨🇳 Chinese</option>
            </select>
          </FormField>

          <FormField label="Timezone" id="profile-tz" error={errors.timezone?.message}>
            <input
              id="profile-tz"
              type="text"
              placeholder="UTC"
              className="input"
              {...register('timezone')}
            />
          </FormField>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            id="profile-save"
            disabled={isLoading || !isDirty}
            className="btn-primary"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="spinner-sm" />
                Saving…
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Security tab ────────────────────────────────────────────────
function SecurityTab() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await dispatch(
      changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
    );
    setIsLoading(false);

    if (changePassword.fulfilled.match(result)) {
      toast.success('Password changed. Please log in again.');
      reset();
      setTimeout(() => navigate('/login'), 1500);
    } else {
      toast.error(result.payload?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="max-w-md">
      <div className="mb-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300/90 leading-relaxed">
        ⚠️ Changing your password will sign you out of <strong>all devices</strong>. You'll need to log in again.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormField label="Current password" id="pw-current" error={errors.currentPassword?.message}>
          <div className="relative">
            <input
              id="pw-current"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white text-xs"
            >
              {showCurrent ? 'Hide' : 'Show'}
            </button>
          </div>
        </FormField>

        <FormField label="New password" id="pw-new" error={errors.newPassword?.message}>
          <div className="relative">
            <input
              id="pw-new"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 chars, uppercase, number"
              className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white text-xs"
            >
              {showNew ? 'Hide' : 'Show'}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm new password" id="pw-confirm" error={errors.confirmPassword?.message}>
          <input
            id="pw-confirm"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
            {...register('confirmPassword')}
          />
        </FormField>

        <button
          type="submit"
          id="change-password-submit"
          disabled={isLoading}
          className="btn-danger"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="spinner-sm" />
              Updating…
            </span>
          ) : (
            'Change Password'
          )}
        </button>
      </form>
    </div>
  );
}

// ── Main Profile Page ────────────────────────────────────────────
const TABS = ['Profile', 'Security'];

export default function ProfilePage() {
  const { user } = useAuth();
  const { userOrgRole, activeOrg } = useOrg();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Profile');

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(clearOrgState());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh">
      {/* Top nav bar */}
      <header className="border-b border-surface-600 bg-surface-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoIcon} alt="Sprint Hive" className="w-8 h-8 object-contain" />
            <span className="font-bold text-sm text-white">
              Sprint<span className="text-brand-400">Hive</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/app" className="btn-ghost btn-sm">Dashboard</Link>
            <button onClick={handleLogout} className="btn-secondary btn-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Account Settings</h1>
          <p className="text-surface-400 text-sm">Manage your profile and security preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 bg-surface-800 rounded-xl w-fit border border-surface-600">
          {TABS.map((tab) => (
            <TabButton
              key={tab}
              active={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'Profile' ? '👤 Profile' : '🔒 Security'}
            </TabButton>
          ))}
        </div>

        {/* Tab content */}
        <div className="card animate-fade-in">
          {activeTab === 'Profile' && <ProfileTab user={user} />}
          {activeTab === 'Security' && <SecurityTab />}
        </div>

        {/* Organization Role & Permissions — shown only on Profile tab */}
        {activeTab === 'Profile' && (
          <>
            <OrgRoleCard role={userOrgRole} orgName={activeOrg?.name} />
            <PermissionsCard role={userOrgRole} />
          </>
        )}

        {/* Account info footer */}
        <div className="mt-6 text-center text-xs text-surface-500">
          Account created{' '}
          {user?.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : '–'}
        </div>
      </main>
    </div>
  );
}
