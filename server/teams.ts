import { Router, Response } from 'express';
import crypto from 'crypto';
import { prisma } from './db';
import { AuthRequest, authenticateJwt } from './auth';

export const teamRouter = Router();

// Protect all team routes with user JWT authentication
teamRouter.use(authenticateJwt);

/**
 * GET /api/user/teams
 * Returns all teams the user owns or is a member of.
 */
teamRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: userId },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        apiKeys: { include: { apiKey: { select: { id: true, name: true, displayKey: true, status: true } } } },
        _count: { select: { members: true, apiKeys: true } },
      },
    });

    const memberships = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            members: { include: { user: { select: { id: true, name: true, email: true } } } },
            apiKeys: { include: { apiKey: { select: { id: true, name: true, displayKey: true, status: true } } } },
            _count: { select: { members: true, apiKeys: true } },
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
teamRouter.post('/', async (req: AuthRequest, res: Response) => {
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
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    res.json({ success: true, team });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to create team.' } });
  }
});

/**
 * GET /api/user/teams/:id
 * Retrieves team details, members, invitations, and active API keys.
 */
teamRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
        },
        invites: {
          where: { status: 'PENDING' },
          select: { id: true, email: true, role: true, expiresAt: true, status: true, createdAt: true },
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
 * POST /api/user/teams/:id/invites
 * Generates an expiring invitation token for a teammate.
 */
teamRouter.post('/:id/invites', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId } = req.params;
    const { email, role = 'MEMBER' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: { message: 'Valid email address is required.' } });
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
      return res.status(403).json({ error: { message: 'Only team owners and administrators can invite members.' } });
    }

    // Check if already member
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

    res.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        inviteUrl: `/dashboard/teams/join?token=${token}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to create team invitation.' } });
  }
});

/**
 * POST /api/user/teams/invites/:token/accept
 * Accepts a team invitation.
 */
teamRouter.post('/invites/:token/accept', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { token } = req.params;

    const invite = await prisma.teamInvite.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite || invite.status !== 'PENDING') {
      return res.status(404).json({ error: { message: 'Invitation is invalid or has already been used.' } });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: { message: 'This invitation token has expired.' } });
    }

    // Add user to team
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: invite.teamId, userId } },
      create: {
        teamId: invite.teamId,
        userId,
        role: invite.role,
      },
      update: {
        role: invite.role,
      },
    });

    // Mark invite accepted
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    res.json({ success: true, message: `Successfully joined ${invite.team.name}!`, teamId: invite.teamId });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to accept invitation.' } });
  }
});

/**
 * DELETE /api/user/teams/:id/members/:memberId
 * Removes a member from the team.
 */
teamRouter.delete('/:id/members/:memberId', async (req: AuthRequest, res: Response) => {
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
 * POST /api/user/teams/:id/keys
 * Associates an existing API key to the team with an optional monthly spend cap.
 */
teamRouter.post('/:id/keys', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id: teamId } = req.params;
    const { apiKeyId, maxMonthlySpendUsd } = req.body;

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
      include: { apiKey: true },
    });

    res.json({ success: true, teamKey });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message || 'Failed to attach team API key.' } });
  }
});
