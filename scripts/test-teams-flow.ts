import { prisma } from '../server/db';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../server/jwtConfig';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

function makeToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, iat: Math.floor(Date.now() / 1000) },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '1h' }
  );
}

async function runTeamsVerificationSuite() {
  console.log('⚡ Starting Complete Teams & API Collaboration Verification Suite...\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  const testId = crypto.randomBytes(4).toString('hex');
  const ownerEmail = `team_owner_${testId}@test.lightningapi.pro`;
  const memberEmail = `team_member_${testId}@test.lightningapi.pro`;

  let ownerUser: any;
  let memberUser: any;
  let testApiKey: any;
  let createdTeamId: string | null = null;

  try {
    // 1. Create test users
    ownerUser = await prisma.user.create({
      data: {
        email: ownerEmail,
        name: 'Test Owner',
        passwordHash: 'test_hash',
        role: 'user',
        emailVerified: true,
      },
    });

    memberUser = await prisma.user.create({
      data: {
        email: memberEmail,
        name: 'Test Member',
        passwordHash: 'test_hash',
        role: 'user',
        emailVerified: true,
      },
    });

    // Create an API key for the owner
    testApiKey = await prisma.apiKey.create({
      data: {
        userId: ownerUser.id,
        name: 'Test Production Key',
        keyHash: crypto.createHash('sha256').update(`sk_test_${testId}`).digest('hex'),
        displayKey: `ld_test_...${testId}`,
        keyPrefix: 'ld_test_',
        status: 'active',
        creditBalanceUsd: 100.0,
      },
    });

    const ownerToken = makeToken(ownerUser);
    const memberToken = makeToken(memberUser);

    // 2. Test Team Creation
    const createRes = await fetch(`${BASE_URL}/api/user/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ name: `Engineering Pod ${testId}` }),
    });

    const createData = await createRes.json();
    assert(createRes.status === 200 && createData.success === true, 'POST /api/user/teams creates team successfully');
    assert(createData.team?.name === `Engineering Pod ${testId}`, 'Team name matches request');
    assert(createData.team?.ownerId === ownerUser.id, 'Team ownerId matches owner user');

    createdTeamId = createData.team.id;

    // 3. Test Invite Creation (Check NO undefined token or URL)
    const inviteRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ email: memberEmail, role: 'MEMBER' }),
    });

    const inviteData = await inviteRes.json();
    assert(inviteRes.status === 200 && inviteData.success === true, 'POST /api/user/teams/:id/invites generates invitation');
    assert(typeof inviteData.token === 'string' && inviteData.token.length > 10, 'Invite response includes non-empty token string');
    assert(!inviteData.inviteUrl.includes('undefined'), 'Invite URL does NOT contain "undefined"');
    assert(inviteData.inviteUrl.includes(`/invite?token=${inviteData.token}`), 'Invite URL correctly formatted as /invite?token=...');
    assert(inviteData.invite?.token === inviteData.token, 'invite.token matches top-level token');

    const generatedToken = inviteData.token;
    const inviteId = inviteData.invite.id;

    // 4. Test Public Invite Inspection (Unauthenticated)
    const inspectRes = await fetch(`${BASE_URL}/api/user/teams/invites/${generatedToken}`);
    const inspectData = await inspectRes.json();
    assert(inspectRes.status === 200 && inspectData.success === true, 'Public GET /api/user/teams/invites/:token succeeds');
    assert(inspectData.invite?.team?.name === `Engineering Pod ${testId}`, 'Inspected invite contains correct team name');
    assert(inspectData.invite?.role === 'MEMBER', 'Inspected invite contains correct role');
    assert(inspectData.invite?.isExpired === false, 'Invite is not expired');
    assert(inspectData.invite?.isAccepted === false, 'Invite is not yet accepted');
    assert(inspectData.currentUser?.isLoggedIn === false, 'Anonymous inspection reports currentUser.isLoggedIn = false');

    // 5. Test Invite Inspection with Logged In User (Member)
    const memberInspectRes = await fetch(`${BASE_URL}/api/user/teams/invites/${generatedToken}`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const memberInspectData = await memberInspectRes.json();
    assert(memberInspectData.currentUser?.isLoggedIn === true, 'Authenticated inspection reports currentUser.isLoggedIn = true');
    assert(memberInspectData.currentUser?.isAlreadyMember === false, 'Member is not yet a member of this team');
    assert(memberInspectData.currentUser?.isEmailMatch === true, 'Email matches invited email');

    // 6. Test Member Accepts Invitation
    const acceptRes = await fetch(`${BASE_URL}/api/user/teams/invites/${generatedToken}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.success === true, 'POST /api/user/teams/invites/:token/accept joins team');
    assert(acceptData.teamId === createdTeamId, 'Accepted teamId matches target team');

    // 7. Verify Team Memberships for Member
    const memberTeamsRes = await fetch(`${BASE_URL}/api/user/teams`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    const memberTeamsData = await memberTeamsRes.json();
    const joinedTeam = memberTeamsData.teams?.find((t: any) => t.id === createdTeamId);
    assert(!!joinedTeam, 'Member now lists the joined team in /api/user/teams');
    assert(joinedTeam?.userRole === 'MEMBER', 'Member has role MEMBER');

    // 8. Re-inspecting Accepted Invite
    const reInspectRes = await fetch(`${BASE_URL}/api/user/teams/invites/${generatedToken}`);
    const reInspectData = await reInspectRes.json();
    assert(reInspectData.invite?.isAccepted === true, 'Inspected invite reports isAccepted = true');

    // 9. Test Attaching API Key to Team
    const attachKeyRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ apiKeyId: testApiKey.id, maxMonthlySpendUsd: 50.0 }),
    });
    const attachKeyData = await attachKeyRes.json();
    assert(attachKeyRes.status === 200 && attachKeyData.success === true, 'Owner can attach API key with monthly spend cap');
    assert(attachKeyData.teamKey?.maxMonthlySpendUsd === 50, 'Spend cap is correctly stored');

    // 10. Test Member Role Promotion (Owner changes Member to ADMIN)
    const roleUpdateRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/members/${memberUser.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    const roleUpdateData = await roleUpdateRes.json();
    assert(roleUpdateRes.status === 200 && roleUpdateData.success === true, 'Owner can update member role to ADMIN');

    // 11. Test Creating and Revoking an Invite
    const invite2Res = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/invites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ email: `revoke_me_${testId}@test.com`, role: 'MEMBER' }),
    });
    const invite2Data = await invite2Res.json();
    const invite2Id = invite2Data.invite.id;

    const revokeRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/invites/${invite2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const revokeData = await revokeRes.json();
    assert(revokeRes.status === 200 && revokeData.success === true, 'Owner/Admin can revoke a pending invite');

    // 12. Test Detaching API Key
    const detachRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/keys/${testApiKey.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const detachData = await detachRes.json();
    assert(detachRes.status === 200 && detachData.success === true, 'Can detach API key from team');

    // 13. Test Member Removing / Leaving Team
    const removeRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}/members/${memberUser.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const removeData = await removeRes.json();
    assert(removeRes.status === 200 && removeData.success === true, 'Can remove member from team');

    // 14. Test Deleting Team
    const deleteRes = await fetch(`${BASE_URL}/api/user/teams/${createdTeamId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const deleteData = await deleteRes.json();
    assert(deleteRes.status === 200 && deleteData.success === true, 'Owner can permanently delete team');
  } finally {
    // Cleanup
    try {
      if (createdTeamId) {
        await prisma.team.deleteMany({ where: { id: createdTeamId } });
      }
      if (testApiKey) {
        await prisma.apiKey.deleteMany({ where: { id: testApiKey.id } });
      }
      if (ownerUser) {
        await prisma.user.deleteMany({ where: { id: ownerUser.id } });
      }
      if (memberUser) {
        await prisma.user.deleteMany({ where: { id: memberUser.id } });
      }
    } catch (cleanupErr: any) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }
  }

  console.log(`\n==================================================`);
  console.log(`Teams Suite Complete: ${passed} / ${total} tests passed!`);
  console.log(`==================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTeamsVerificationSuite().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
