import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { User, Shield, Palette, Bell, Check } from 'lucide-react';
import api from '../../services/api';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      return toast.error("Passwords don't match");
    }
    try {
      await api.post('/auth/change-password', passwordForm);
      toast.success('Password updated');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error('Failed to update password');
    }
  };

  const setTheme = (theme) => {
    localStorage.setItem('theme', theme);
    toast.success(`Theme set to ${theme}`);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Settings</h1>

      <div className="flex gap-6 border-b border-surface-600 mb-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors relative flex items-center gap-2 ${
              activeTab === id ? 'text-brand-400' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <Icon size={16} />
            {label}
            {activeTab === id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white">Profile Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Name</label>
                <input type="text" className="input" defaultValue="Current User" />
              </div>
              <div>
                <label className="label">Timezone</label>
                <select className="input">
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>Europe/London</option>
                </select>
              </div>
              <div>
                <label className="label">Language</label>
                <select className="input">
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
            </div>
            <button className="btn-primary">Save Profile</button>
          </div>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
            <h3 className="font-bold text-lg text-white">Change Password</h3>
            <div>
              <label className="label">Current Password</label>
              <input type="password" required className="input" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" required className="input" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" required className="input" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary">Update Password</button>
          </form>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white">Theme Selection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'light', label: 'Light', desc: 'Bright mode' },
                { id: 'dark', label: 'Dark', desc: 'Default Sprint Hive mode', active: true },
                { id: 'system', label: 'System', desc: 'Match OS preference' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`card text-left p-4 hover:border-brand-500 transition-all duration-150 border-2 ${
                    t.active ? 'border-brand-500 bg-brand-500/10' : 'border-surface-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-white text-sm">{t.label}</p>
                    {t.active && <Check size={16} className="text-brand-400" />}
                  </div>
                  <p className="text-xs text-surface-400">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-white">Email Notifications</h3>
            <div className="space-y-4">
              {['Task assigned to me', 'Comment on my task', 'Deadline reminder', 'Task completed'].map(label => (
                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-surface-900 cursor-pointer" defaultChecked />
                  <span className="text-surface-200 text-sm group-hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>
            <button className="btn-primary">Save Preferences</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
