import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  LogIn,
  UserPlus,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userFetch } from '../utils/api';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface InviteDetails {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
  isAccepted: boolean;
  isRevoked: boolean;
  team: {
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    membersCount: number;
  };
}

export const InvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token: routeToken } = useParams();
  const token = searchParams.get('token') || routeToken;
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [isAlreadyMember, setIsAlreadyMember] = useState(false);

  // Acceptance states
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Declining states
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (!token || token.trim() === '' || token === 'undefined') {
      setLoading(false);
      setErrorMsg('No valid invitation token was provided. Please check the full invitation link.');
      return;
    }

    const fetchInvite = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await userFetch(`/api/user/teams/invites/${encodeURIComponent(token.trim())}`);
        const data = await res.json();

        if (res.ok && data.success && data.invite) {
          setInvite(data.invite);
          if (data.invite.isExpired) setIsExpired(true);
          if (data.invite.isAccepted) setIsAccepted(true);
          if (data.invite.isRevoked) setIsRevoked(true);
          if (data.currentUser?.isAlreadyMember) setIsAlreadyMember(true);
        } else {
          setErrorMsg(data.error?.message || 'Invitation not found or no longer active.');
          if (data.isExpired) setIsExpired(true);
          if (data.isAccepted) setIsAccepted(true);
          if (data.isRevoked) setIsRevoked(true);
        }
      } catch (err: any) {
        console.error('Failed to inspect invitation', err);
        setErrorMsg('Network error verifying invitation. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token, isAuthenticated]);

  const handleAcceptInvite = async () => {
    if (!token || token === 'undefined') return;
    setAccepting(true);
    setErrorMsg(null);

    try {
      const res = await userFetch(`/api/user/teams/invites/${encodeURIComponent(token.trim())}/accept`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAcceptSuccess(true);
        setSuccessMessage(data.message || 'Successfully joined team workspace!');
        setTimeout(() => {
          navigate('/dashboard/teams');
        }, 1800);
      } else {
        setErrorMsg(data.error?.message || 'Failed to accept invitation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while accepting invitation.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!token || token === 'undefined') return;
    setDeclining(true);

    try {
      const res = await userFetch(`/api/user/teams/invites/${encodeURIComponent(token.trim())}/decline`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeclined(true);
      } else {
        setErrorMsg(data.error?.message || 'Failed to decline invitation.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setDeclining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col justify-between text-[#1c1917] font-sans antialiased selection:bg-[#7136E8]/10 selection:text-[#7136E8]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-lg">
          {/* Card Container */}
          <div className="bg-white border border-[#e5e7eb] rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 space-y-6">
            {/* Loading State */}
            {loading && (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#7136E8]/10 text-[#7136E8] flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#111827]">Verifying Invitation Link</h3>
                  <p className="text-xs text-[#6b7280] mt-1">
                    Checking cryptographic token and workspace credentials...
                  </p>
                </div>
              </div>
            )}

            {/* Accept Success State */}
            {!loading && acceptSuccess && (
              <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">Welcome to the Team!</h2>
                  <p className="text-xs text-[#4b5563] mt-1.5">{successMessage}</p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-[#7136E8]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Redirecting to your Team Workspace...</span>
                </div>
              </div>
            )}

            {/* Declined State */}
            {!loading && declined && (
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#6b7280] flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#111827]">Invitation Declined</h3>
                <p className="text-xs text-[#6b7280]">
                  You have declined this workspace invitation. You can close this window or return to the dashboard.
                </p>
                <div className="pt-2">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111827] text-white hover:bg-black transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}

            {/* Error / Invalid / Expired / Revoked State */}
            {!loading && !acceptSuccess && !declined && (errorMsg || isExpired || isAccepted || isRevoked) && (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-500/20">
                  {isExpired ? (
                    <Clock className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#111827]">
                    {isExpired
                      ? 'Invitation Expired'
                      : isAccepted
                      ? 'Invitation Already Accepted'
                      : isRevoked
                      ? 'Invitation Revoked'
                      : 'Invalid Invitation Link'}
                  </h3>
                  <p className="text-xs text-[#6b7280] mt-1.5 max-w-sm mx-auto leading-relaxed">
                    {isExpired
                      ? 'This invitation link was valid for 7 days and has expired. Please contact the team administrator to generate a fresh invitation.'
                      : isAccepted
                      ? 'This invitation has already been accepted. If you are already part of the team, you can access your workspace from the dashboard.'
                      : isRevoked
                      ? 'This invitation link was cancelled by the workspace administrator.'
                      : errorMsg || 'The invitation link you followed is not recognized or may have been relocated.'}
                  </p>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#7136E8] text-white hover:bg-[#6029d2] transition-colors shadow-sm"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-[#4b5563] hover:bg-[#f4f4f0] transition-colors"
                  >
                    Return Home
                  </Link>
                </div>
              </div>
            )}

            {/* Active Valid Invitation Details */}
            {!loading && !acceptSuccess && !declined && invite && !isExpired && !isAccepted && !isRevoked && (
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#7136E8]/10 text-[#7136E8] flex items-center justify-center mx-auto border border-[#7136E8]/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#7136E8]/10 text-[#7136E8] border border-[#7136E8]/20">
                      Team Workspace Invitation
                    </span>
                    <h1 className="text-2xl font-bold text-[#111827] mt-1.5">
                      Join {invite.team.name}
                    </h1>
                    <p className="text-xs text-[#6b7280] mt-1">
                      Invited by{' '}
                      <span className="font-semibold text-[#111827]">
                        {invite.team.ownerName}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6b7280]">Workspace:</span>
                    <span className="font-bold text-[#111827]">{invite.team.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6b7280]">Role Assigned:</span>
                    <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase bg-[#7136E8]/15 text-[#7136E8]">
                      {invite.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6b7280]">Invited Email:</span>
                    <span className="font-mono text-[11px] text-[#374151]">{invite.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6b7280]">Active Members:</span>
                    <span className="font-mono text-xs text-[#374151]">
                      {invite.team.membersCount} member{invite.team.membersCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#e5e7eb]/80">
                    <span className="text-[#6b7280] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Valid until:</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#4b5563]">
                      {new Date(invite.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Account Isolation Notice */}
                <div className="p-3.5 rounded-xl bg-[#7136E8]/[0.03] border border-[#7136E8]/15 flex items-start gap-2.5 text-xs text-[#4b5563] leading-relaxed">
                  <Shield className="w-4 h-4 text-[#7136E8] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#111827]">Account Isolation:</span> Joining
                    this workspace will give you access to shared team API keys and collaboration.
                    Your personal plans and keys remain completely private and unaltered.
                  </div>
                </div>

                {/* Already Member Notice */}
                {isAlreadyMember ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs text-center font-medium">
                      You are already an active member of this team workspace.
                    </div>
                    <Link
                      to="/dashboard/teams"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#7136E8] hover:bg-[#6029d2] text-white transition-all shadow-md cursor-pointer"
                    >
                      <span>Open Team Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : isAuthenticated ? (
                  /* User is Logged In: Can Accept or Decline */
                  <div className="space-y-3 pt-2">
                    {user?.email.toLowerCase() !== invite.email.toLowerCase() && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-[11px] leading-relaxed">
                        Notice: You are signed in as{' '}
                        <strong className="font-mono">{user?.email}</strong>. This invitation was
                        addressed to{' '}
                        <strong className="font-mono">{invite.email}</strong>. Accepting will link
                        this workspace to your current account.
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={accepting}
                      onClick={handleAcceptInvite}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#7136E8] hover:bg-[#6029d2] disabled:opacity-50 text-white transition-all shadow-md cursor-pointer"
                    >
                      {accepting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Joining Workspace...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Invitation & Join Team</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={declining}
                      onClick={handleDeclineInvite}
                      className="w-full py-2 text-xs font-medium text-[#6b7280] hover:text-[#111827] transition-colors cursor-pointer"
                    >
                      {declining ? 'Declining...' : 'Decline Invitation'}
                    </button>
                  </div>
                ) : (
                  /* User is NOT Logged In: Sign In or Register to Accept */
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-center text-[#6b7280]">
                      Sign in or create a free account to accept this invitation:
                    </p>

                    <Link
                      to={`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#7136E8] hover:bg-[#6029d2] text-white transition-all shadow-md cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Accept</span>
                    </Link>

                    <Link
                      to={`/register?redirect=${encodeURIComponent(`/invite?token=${token}`)}`}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-[#d1d5db] hover:bg-[#f9fafb] text-[#374151] transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-[#6b7280]" />
                      <span>Create Free Account</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InvitePage;
