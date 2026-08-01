import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import useAuth from '../../hooks/useAuth';
import { fetchMyOrgs } from '../../store/slices/orgSlice';
import orgService from '../../services/orgService';
import logoIcon from '../../assets/logo_icon.png';

const STATE = { loading: 'loading', ready: 'ready', accepting: 'accepting', done: 'done', error: 'error' };

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();

  const [state, setState] = useState(STATE.loading);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState('');

  // Fetch invite details (public endpoint)
  useEffect(() => {
    if (!token) { setState(STATE.error); setError('No invite token in URL.'); return; }
    orgService
      .getInviteInfo(token)
      .then((data) => { setInvite(data.invite); setState(STATE.ready); })
      .catch((err) => {
        setError(err.response?.data?.message || 'This invite is invalid or has expired.');
        setState(STATE.error);
      });
  }, [token]);

  const handleAccept = async () => {
    setState(STATE.accepting);
    try {
      const data = await orgService.acceptInvite(token);
      // Refresh org list so new org shows in switcher
      await dispatch(fetchMyOrgs());
      toast.success(data.message);
      setState(STATE.done);
      setTimeout(() => navigate('/app'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite.');
      setState(STATE.error);
    }
  };

  const renderContent = () => {
    if (state === STATE.loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <img src={logoIcon} alt="Loading" className="w-10 h-10 object-contain animate-pulse-slow mx-auto" />
          <p className="text-surface-400 text-sm font-medium">Loading invite…</p>
        </div>
      );
    }

    if (state === STATE.error) {
      return (
        <div className="card text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">Invite Unavailable</h1>
          <p className="text-surface-400 text-sm mb-6">{error}</p>
          <Link to={isAuthenticated ? '/app' : '/login'} className="btn-secondary">
            {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
          </Link>
        </div>
      );
    }

    if (state === STATE.done) {
      return (
        <div className="card text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-white mb-2">You're in!</h1>
          <p className="text-surface-400 text-sm">Redirecting to your new workspace…</p>
        </div>
      );
    }

    // STATE.ready or STATE.accepting
    return (
      <div className="card animate-slide-up">
        <div className="text-center mb-6">
          <img src={logoIcon} alt="Sprint Hive" className="w-10 h-10 mb-3 object-contain mx-auto" />
          <h1 className="text-xl font-bold text-white mb-1">You're invited!</h1>
          <p className="text-surface-400 text-sm">
            <strong className="text-white">{invite?.invitedBy?.name || 'Someone'}</strong>
            {' '}invited you to join
          </p>
        </div>

        {/* Org card */}
        <div className="bg-surface-800 border border-surface-600 rounded-xl p-4 mb-6 text-center">
          <p className="text-lg font-bold text-white mb-1">{invite?.organization?.name}</p>
          {invite?.organization?.description && (
            <p className="text-surface-400 text-xs mb-2">{invite.organization.description}</p>
          )}
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-500/15 text-brand-400 capitalize">
            As {invite?.role}
          </span>
        </div>

        {/* Expiry notice */}
        <p className="text-xs text-surface-400 text-center mb-6">
          Expires {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
        </p>

        {isAuthenticated ? (
          <>
            {/* Email mismatch warning */}
            <div className="mb-4 p-3 rounded-lg bg-surface-800 border border-surface-600 text-xs text-surface-400 text-center">
              Accepting as <span className="text-white font-medium">{user?.email}</span>
            </div>
            <button
              id="accept-invite-btn"
              onClick={handleAccept}
              disabled={state === STATE.accepting}
              className="btn-primary w-full btn-lg"
            >
              {state === STATE.accepting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Accepting…
                </span>
              ) : (
                'Accept Invitation →'
              )}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-surface-400 text-sm">Sign in or create an account to accept this invite.</p>
            <Link
              to={`/login?invite=${token}`}
              className="btn-primary w-full btn-lg text-center block"
            >
              Sign In to Accept →
            </Link>
            <Link
              to={`/register?invite=${token}`}
              className="btn-secondary w-full text-center block"
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-900 bg-mesh flex items-center justify-center px-6">
      <div className="w-full max-w-md">{renderContent()}</div>
    </div>
  );
}
