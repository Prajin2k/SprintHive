import React, { useState } from 'react';
import toast from 'react-hot-toast';
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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-surface-50 mb-8">Settings</h1>

      <div className="flex gap-6 border-b border-surface-700 mb-8">
        {['profile', 'security', 'appearance', 'notifications'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-brand-500' : 'text-surface-400 hover:text-surface-200'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500"></div>}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-surface-100">Profile Settings</h3>
            <div className="grid grid-cols-2 gap-4">
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
          <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
            <h3 className="font-bold text-lg text-surface-100">Change Password</h3>
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
            <h3 className="font-bold text-lg text-surface-100">Theme</h3>
            <div className="flex gap-4">
              <button onClick={() => setTheme('light')} className="card flex-1 text-center hover:border-brand-500 border-2 border-transparent">Light</button>
              <button onClick={() => setTheme('dark')} className="card flex-1 text-center hover:border-brand-500 border-2 border-brand-500">Dark</button>
              <button onClick={() => setTheme('system')} className="card flex-1 text-center hover:border-brand-500 border-2 border-transparent">System</button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="font-bold text-lg text-surface-100">Email Notifications</h3>
            <div className="space-y-4">
              {['Task assigned to me', 'Comment on my task', 'Deadline reminder', 'Task completed'].map(label => (
                <label key={label} className="flex items-center gap-3">
                  <input type="checkbox" className="w-5 h-5 rounded border-surface-600 bg-surface-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-surface-900" defaultChecked />
                  <span className="text-surface-200">{label}</span>
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
