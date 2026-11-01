import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from './db';
import { AuthRequest, authenticateJwt, optionalAuthenticateJwt } from './auth';
import { sendTeamInviteEmail } from './email';

export const teamRouter = Router();

// ============================================================================
// PUBLIC / OPTIONALLY AUTHENTICATED INVITATION ENDPOINTS
// ============================================================================

/**
 * GET /api/user/teams/invites/:token
 * Public inspection of a team invitation token.
 * Anyone with the link can view the team name and invitation status.
 */
teamRouter.get('/invites/:token', optionalAuthenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== 'string' || token.trim() === '' || token === 'undefined') {
      return res.status(400).json({ error: { message: 'Invalid or missing invitation token.' } });
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { token: token.trim() },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: { message: 'Invitation not found. The link may be invalid or expired.' } });
    }

    const isExpired = new Date(invite.expiresAt) < new Date();
    const isAccepted = invite.status === 'ACCEPTED';
    const isRevoked = invite.status === 'REVOKED';

    let isAlreadyMember = false;
    let isEmailMatch = false;

    if (req.user) {
      isEmailMatch = req.user.email.toLowerCase() === invite.email.toLowerCase();
      const existingMembership = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: invite.teamId, userId: req.user.id } },
      });
      isAlreadyMember = !!existingMembership || invite.team.ownerId === req.user.id;
    }

    res.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        isExpired,
        isAccepted,
        isRevoked,
        team: {
          id: invite.team.id,
          name: invite.team.name,
          ownerName: invite.team.owner.name || invite.team.owner.email,
          ownerEmail: invite.team.owner.email,
          membersCount: invite.team._count.members,
        },
      },
      currentUser: req.user
        ? {
            isLoggedIn: true,
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            isAlreadyMember,
            isEmailMatch,
          }
        : {
            isLoggedIn: false,
          },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to inspect invitation.' } });
  }
});

// ============================================================================
// PROTECTED TEAM ENDPOINTS (Require authenticateJwt)
// ============================================================================

/**
 * POST /api/user/teams/invites/:token/accept
 * Accepts a team invitation for the authenticated user.
 */
teamRouter.post('/invites/:token/accept', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { token } = req.params;

    if (!token || token === 'undefined') {
      return res.status(400).json({ error: { message: 'Invalid or missing invitation token.' } });
    }

    const invite = await prisma.teamInvite.findUnique({
      where: { token: token.trim() },
      include: { team: true },
    });

    if (!invite) {
      return res.status(404).json({ error: { message: 'Invitation not found or invalid token.' } });
    }

    if (invite.status === 'ACCEPTED') {
      return res.status(400).json({ error: { message: 'This invitation has already been accepted.' } });
    }

    if (invite.status === 'REVOKED') {
      return res.status(400).json({ error: { message: 'This invitation was revoked by the team administrator.' } });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: { message: 'This invitation token has expired.' } });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
    });

    if (existingMember) {
      // Mark accepted if pending
      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      });
      return res.json({
        success: true,
        message: `You are already a member of ${invite.team.name}.`,
        teamId: invite.teamId,
      });
    }

    // Add user to team
    await prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId,
        role: invite.role,
      },
    });

    // Mark invite accepted
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({
      success: true,
      message: `Successfully joined ${invite.team.name}!`,
      teamId: invite.teamId,
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to accept invitation.' } });
  }
});

/**
 * POST /api/user/teams/invites/:token/decline
 * Declines a team invitation.
 */
teamRouter.post('/invites/:token/decline', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token: token.trim() },
    });

    if (!invite || invite.status !== 'PENDING') {
      return res.status(404).json({ error: { message: 'Invitation not found or already processed.' } });
    }

    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'REVOKED' },
    });

    res.json({ success: true, message: 'Invitation declined.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to decline invitation.' } });
  }
});

/**
 * GET /api/user/teams/available-keys
 * Returns user's active API keys that can be shared with a team workspace.
 */
teamRouter.get('/available-keys', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const keys = await prisma.apiKey.findMany({
      where: { userId, status: 'active' },
      select: {
        id: true,
        name: true,
        displayKey: true,
        creditBalanceUsd: true,
        tokensUsed: true,
        totalRequests: true,
        createdAt: true,
        teamApiKey: {
          select: {
            id: true,
            teamId: true,
            maxMonthlySpendUsd: true,
            currentMonthSpendUsd: true,
            team: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, keys });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to list available API keys.' } });
  }
});

/**
 * GET /api/user/teams
 * Returns all teams the user owns or is a member of.
 */
teamRouter.get('/', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        apiKeys: {
          include: {
            apiKey: {
              select: {
                id: true,
                name: true,
                displayKey: true,
                status: true,
                totalRequests: true,
                tokensUsed: true,
                creditBalanceUsd: true,
              },
            },
          },
        },
        invites: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { members: true, apiKeys: true, invites: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            members: {
              include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
              orderBy: { joinedAt: 'asc' },
            },
            apiKeys: {
              include: {
                apiKey: {
                  select: {
                    id: true,
                    name: true,
                    displayKey: true,
                    status: true,
                    totalRequests: true,
                    tokensUsed: true,
                    creditBalanceUsd: true,
                  },
                },
              },
            },
            invites: {
              where: { status: 'PENDING' },
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { members: true, apiKeys: true, invites: true } },
          },
        },
      },
    });

    const teams = [
      ...ownedTeams.map((t) => ({ ...t, userRole: 'OWNER' })),
      ...memberships
        .filter((m) => m.team.ownerId !== userId)
        .map((m) => ({ ...m.team, userRole: m.role })),
    ];

    res.json({ success: true, count: teams.length, teams });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to list teams.' } });
  }
});

/**
 * POST /api/user/teams
 * Creates a new developer collaboration team.
 */
teamRouter.post('/', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Team name is required.' } });
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        apiKeys: true,
        invites: true,
      },
    });

    res.json({ success: true, team: { ...team, userRole: 'OWNER' } });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to create team.' } });
  }
});

/**
 * GET /api/user/teams/:id
 * Retrieves team details, members, invitations, and active API keys.
 */
teamRouter.get('/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        invites: {
          where: { status: 'PENDING' },
          select: { id: true, email: true, role: true, token: true, expiresAt: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        apiKeys: {
          include: {
            apiKey: {
              select: {
                id: true,
                name: true,
                displayKey: true,
                status: true,
                totalRequests: true,
                tokensUsed: true,
                creditBalanceUsd: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const isMember = team.members.some((m) => m.userId === userId) || team.ownerId === userId;
    if (!isMember && req.user?.role !== 'admin') {
      return res.status(403).json({ error: { message: 'You are not authorized to view this team.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const userRole = team.ownerId === userId ? 'OWNER' : currentMember?.role || 'MEMBER';

    res.json({ success: true, team, userRole });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to get team details.' } });
  }
});

/**
 * PATCH /api/user/teams/:id
 * Renames a team (owner or admin only).
 */
teamRouter.patch('/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: { message: 'Team name is required.' } });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const isOwnerOrAdmin = team.ownerId === userId || currentMember?.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: { message: 'Only team owners or administrators can rename the team.' } });
    }

    const updated = await prisma.team.update({
      where: { id },
      data: { name: name.trim() },
    });

    res.json({ success: true, team: updated });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to rename team.' } });
  }
});

/**
 * DELETE /api/user/teams/:id
 * Deletes a team (owner only).
 */
teamRouter.delete('/:id', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    if (team.ownerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Only the team owner can delete this workspace.' } });
    }

    await prisma.team.delete({ where: { id } });

    res.json({ success: true, message: 'Team deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to delete team.' } });
  }
});

/**
 * POST /api/user/teams/:id/leave
 * Allows a member to leave a team (owner cannot leave without transferring ownership).
 */
teamRouter.post('/:id/leave', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const team = await prisma.team.findUnique({ where: { id } });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    if (team.ownerId === userId) {
      return res.status(400).json({
        error: { message: 'Team owners cannot leave their team. You must delete the team or transfer ownership.' },
      });
    }

    await prisma.teamMember.deleteMany({
      where: { teamId: id, userId },
    });

    res.json({ success: true, message: 'You have left the team.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to leave team.' } });
  }
});

/**
 * POST /api/user/teams/:id/invites
 * Generates an expiring invitation token for a teammate and returns the full invite URL.
 */
teamRouter.post('/:id/invites', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: { message: 'Valid email address is required.' } });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, owner: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const isOwnerOrAdmin = team.ownerId === userId || currentMember?.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: { message: 'Only team owners and administrators can invite members.' } });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existingUser && team.members.some((m) => m.userId === existingUser.id)) {
      return res.status(400).json({ error: { message: 'This user is already a member of the team.' } });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    const invite = await prisma.teamInvite.create({
      data: {
        teamId,
        email: email.toLowerCase().trim(),
        role: role.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Derive canonical URL
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'lightningapi.pro';
    const baseUrl = `${protocol}://${host}`;
    const inviteUrl = `${baseUrl}/invite?token=${token}`;

    // Dispatch notification email asynchronously without blocking response
    sendTeamInviteEmail({
      email: invite.email,
      inviterName: req.user!.name || req.user!.email,
      teamName: team.name,
      role: invite.role,
      inviteUrl,
    }).catch((emailErr) => {
      console.warn(`[TEAMS] Failed to dispatch invitation email to ${invite.email}:`, emailErr.message);
    });

    res.json({
      success: true,
      token,
      inviteUrl,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        token: invite.token,
        expiresAt: invite.expiresAt,
        status: invite.status,
        inviteUrl,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to create team invitation.' } });
  }
});

/**
 * DELETE /api/user/teams/:id/invites/:inviteId
 * Revokes or deletes a pending team invitation.
 */
teamRouter.delete('/:id/invites/:inviteId', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId, inviteId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const isOwnerOrAdmin = team.ownerId === userId || currentMember?.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: { message: 'Only team owners and administrators can revoke invites.' } });
    }

    await prisma.teamInvite.delete({
      where: { id: inviteId },
    });

    res.json({ success: true, message: 'Invitation revoked.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to revoke invite.' } });
  }
});

/**
 * DELETE /api/user/teams/:id/members/:memberId
 * Removes a member from the team.
 */
teamRouter.delete('/:id/members/:memberId', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId, memberId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const isOwnerOrAdmin = team.ownerId === userId || currentMember?.role === 'ADMIN';

    if (!isOwnerOrAdmin && userId !== memberId) {
      return res.status(403).json({ error: { message: 'Not authorized to remove members from this team.' } });
    }

    if (team.ownerId === memberId) {
      return res.status(400).json({ error: { message: 'The team owner cannot be removed from the team.' } });
    }

    await prisma.teamMember.deleteMany({
      where: { teamId, userId: memberId },
    });

    res.json({ success: true, message: 'Team member removed.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to remove member.' } });
  }
});

/**
 * PATCH /api/user/teams/:id/members/:memberId
 * Updates a member's role (OWNER only).
 */
teamRouter.patch('/:id/members/:memberId', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['ADMIN', 'MEMBER'].includes(role.toUpperCase())) {
      return res.status(400).json({ error: { message: 'Role must be either ADMIN or MEMBER.' } });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    if (team.ownerId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: { message: 'Only the team owner can modify member roles.' } });
    }

    if (team.ownerId === memberId) {
      return res.status(400).json({ error: { message: 'Cannot alter role of the team owner.' } });
    }

    const updated = await prisma.teamMember.updateMany({
      where: { teamId, userId: memberId },
      data: { role: role.toUpperCase() },
    });

    res.json({ success: true, message: 'Member role updated.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to update member role.' } });
  }
});

/**
 * GET /api/user/teams/:id/keys
 * Returns all API keys attached to the team.
 */
teamRouter.get('/:id/keys', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
        apiKeys: {
          include: {
            apiKey: {
              select: {
                id: true,
                name: true,
                displayKey: true,
                status: true,
                totalRequests: true,
                tokensUsed: true,
                creditBalanceUsd: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const isMember = team.members.some((m) => m.userId === userId) || team.ownerId === userId;
    if (!isMember) {
      return res.status(403).json({ error: { message: 'Not authorized to view keys for this team.' } });
    }

    res.json({ success: true, apiKeys: team.apiKeys });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to list team API keys.' } });
  }
});

/**
 * POST /api/user/teams/:id/keys
 * Associates an existing API key to the team with an optional monthly spend cap.
 */
teamRouter.post('/:id/keys', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId } = req.params;
    const { apiKeyId, maxMonthlySpendUsd } = req.body;

    if (!apiKeyId) {
      return res.status(400).json({ error: { message: 'API key ID is required.' } });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const isOwnerOrAdmin = team.ownerId === userId || currentMember?.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: { message: 'Only team owners and administrators can manage team keys.' } });
    }

    // Verify key belongs to user
    const key = await prisma.apiKey.findFirst({
      where: { id: apiKeyId, userId },
    });

    if (!key) {
      return res.status(404).json({ error: { message: 'API key not found or not owned by you.' } });
    }

    const teamKey = await prisma.teamApiKey.upsert({
      where: { apiKeyId },
      create: {
        teamId,
        apiKeyId,
        maxMonthlySpendUsd: maxMonthlySpendUsd ? Number(maxMonthlySpendUsd) : null,
      },
      update: {
        teamId,
        maxMonthlySpendUsd: maxMonthlySpendUsd ? Number(maxMonthlySpendUsd) : null,
      },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            displayKey: true,
            status: true,
            totalRequests: true,
            tokensUsed: true,
            creditBalanceUsd: true,
          },
        },
      },
    });

    res.json({ success: true, teamKey });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to attach team API key.' } });
  }
});

/**
 * DELETE /api/user/teams/:id/keys/:keyId
 * Detaches an API key from the team workspace.
 */
teamRouter.delete('/:id/keys/:keyId', authenticateJwt, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId, keyId } = req.params;

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) {
      return res.status(404).json({ error: { message: 'Team not found.' } });
    }

    const currentMember = team.members.find((m) => m.userId === userId);
    const isOwnerOrAdmin = team.ownerId === userId || currentMember?.role === 'ADMIN';

    if (!isOwnerOrAdmin) {
      return res.status(403).json({ error: { message: 'Only team owners and administrators can remove team keys.' } });
    }

    await prisma.teamApiKey.deleteMany({
      where: {
        teamId,
        OR: [{ id: keyId }, { apiKeyId: keyId }],
      },
    });

    res.json({ success: true, message: 'API key detached from team.' });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to detach team API key.' } });
  }
});
