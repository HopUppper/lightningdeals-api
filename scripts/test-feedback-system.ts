import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'lightningdeals_secret_jwt_key_2026';
const BASE_URL = 'http://localhost:3001';

async function runFeedbackSystemTests() {
  console.log('================================================================');
  console.log('⚡ STARTING COMPREHENSIVE CUSTOMER REVIEWS & FEEDBACK TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] ${name} — ${details || 'Assertion failed'}`);
    }
  }

  // 1. Setup Isolated Test Users
  const customerEmail = `test_customer_${Date.now()}@lightningapi.test`;
  const otherCustomerEmail = `other_customer_${Date.now()}@lightningapi.test`;
  const adminEmail = `test_admin_${Date.now()}@lightningapi.test`;

  const customerUser = await prisma.user.create({
    data: {
      email: customerEmail,
      name: 'Dev Persona',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active',
      emailVerified: true,
    },
  });

  const otherCustomer = await prisma.user.create({
    data: {
      email: otherCustomerEmail,
      name: 'Other Persona',
      passwordHash: 'dummyhash',
      role: 'user',
      status: 'active',
      emailVerified: true,
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Security Admin',
      passwordHash: 'dummyhash',
      role: 'admin',
      status: 'active',
      emailVerified: true,
    },
  });

  const customerToken = jwt.sign({ id: customerUser.id, email: customerUser.email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  const otherToken = jwt.sign({ id: otherCustomer.id, email: otherCustomer.email, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  const adminToken = jwt.sign({ id: adminUser.id, email: adminUser.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

  let feedbackId = '';
  let reviewId = '';

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: CUSTOMER PRIVATE FEEDBACK SUBMISSIONS
    // ------------------------------------------------------------------------
    console.log('\n--- Section 1: Customer Private Feedback Submissions ---');

    // 1.1 Unauthenticated submission blocked with 401
    const unauthRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, message: 'Valid feedback text' }),
    });
    assert('1.1 Unauthenticated feedback submission rejected with 401', unauthRes.status === 401);

    // 1.2 Invalid ratings rejected
    const invalidRatingRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 6, message: 'Rating is out of range' }),
    });
    assert('1.2 Rating > 5 rejected with 400', invalidRatingRes.status === 400);

    const zeroRatingRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 0, message: 'Rating is zero' }),
    });
    assert('1.2b Rating = 0 rejected with 400', zeroRatingRes.status === 400);

    const floatRatingRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 4.5, message: 'Fractional rating' }),
    });
    assert('1.2c Non-integer rating rejected with 400', floatRatingRes.status === 400);

    // 1.3 Empty / too short message rejected
    const shortMsgRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 4, message: 'abc' }),
    });
    assert('1.3 Feedback < 5 characters rejected with 400', shortMsgRes.status === 400);

    // 1.4 Valid submission succeeds and records server-side identity
    const validFeedbackRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        rating: 5,
        category: 'api_reliability',
        message: 'The 5-hour rolling renewal prevents quota freezes during long coding sessions.',
        forgedUserId: 'attacker-id-1234', // Forged ID should be ignored
      }),
    });
    const validFeedbackData: any = await validFeedbackRes.json();
    assert('1.4 Valid private feedback created with 201', validFeedbackRes.status === 201 && validFeedbackData.success === true);
    feedbackId = validFeedbackData.feedback?.id;

    // Verify database record has server-assigned userId, not forged ID
    const dbFeedback = await prisma.customerFeedback.findUnique({ where: { id: feedbackId } });
    assert('1.4b Server correctly bound customer identity to authenticated user', dbFeedback?.userId === customerUser.id);
    assert('1.4c Initial feedback status is PENDING', dbFeedback?.status === 'PENDING');

    // 1.5 Rate-limiting cooldown prevents duplicate spam
    const duplicateRes = await fetch(`${BASE_URL}/api/user/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ rating: 5, message: 'Rapid duplicate feedback attempt' }),
    });
    assert('1.5 Cooldown rejects rapid duplicate within 60s with 429', duplicateRes.status === 429);

    // 1.6 Customer can view their own history
    const historyRes = await fetch(`${BASE_URL}/api/user/feedback/history`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const historyData: any = await historyRes.json();
    assert(
      '1.6 Customer feedback history lists own submission',
      historyRes.status === 200 && Array.isArray(historyData.history) && historyData.history.some((h: any) => h.id === feedbackId)
    );

    // 1.7 Multi-tenant isolation: Other customer CANNOT see first customer's feedback
    const otherHistoryRes = await fetch(`${BASE_URL}/api/user/feedback/history`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    const otherHistoryData: any = await otherHistoryRes.json();
    assert(
      '1.7 Other customer history does NOT expose first customer feedback',
      otherHistoryRes.status === 200 && otherHistoryData.history.length === 0
    );

    // ------------------------------------------------------------------------
    // SECTION 2: ADMINISTRATOR PERMISSIONS & CONTROLS
    // ------------------------------------------------------------------------
    console.log('\n--- Section 2: Administrator Permissions & Feedback Controls ---');

    // 2.1 Non-admin blocked from admin feedback endpoint
    const nonAdminListRes = await fetch(`${BASE_URL}/api/admin/feedback`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert('2.1 Customer cannot access /api/admin/feedback (blocked with 403)', nonAdminListRes.status === 403);

    // 2.2 Authorized admin can view private feedback list with customer info
    const adminListRes = await fetch(`${BASE_URL}/api/admin/feedback`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminListData: any = await adminListRes.json();
    assert('2.2 Admin can retrieve feedback list', adminListRes.status === 200 && adminListData.success === true);
    const listedItem = adminListData.items?.find((i: any) => i.id === feedbackId);
    assert('2.2b Admin item contains customer name and email', listedItem && listedItem.user?.email === customerEmail);

    // 2.3 Admin statistics are computed accurately from real records
    const adminStatsRes = await fetch(`${BASE_URL}/api/admin/feedback/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsData: any = await adminStatsRes.json();
    assert(
      '2.3 Admin stats returns counts and average',
      adminStatsRes.status === 200 &&
        adminStatsData.stats.totalSubmissions >= 1 &&
        adminStatsData.stats.uniqueCustomers >= 1 &&
        typeof adminStatsData.stats.averageRating === 'number'
    );

    // 2.4 Admin updates status to REVIEWED and adds internal notes
    const updateRes = await fetch(`${BASE_URL}/api/admin/feedback/${feedbackId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        status: 'REVIEWED',
        adminNotes: 'Validated rolling window quota feedback with engineering team.',
      }),
    });
    const updateData: any = await updateRes.json();
    assert('2.4 Admin updates feedback status and internal notes', updateRes.status === 200 && updateData.feedback?.status === 'REVIEWED');

    const dbUpdated = await prisma.customerFeedback.findUnique({ where: { id: feedbackId } });
    assert('2.4b Internal admin notes saved in database', dbUpdated?.adminNotes?.includes('engineering team') === true);
    assert('2.4c ReviewedBy assigned to admin user', dbUpdated?.reviewedBy === adminUser.id);

    // ------------------------------------------------------------------------
    // SECTION 3: STRICT DATA SEPARATION & PUBLIC PRIVACY ENFORCEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- Section 3: Strict Data Separation & Public Privacy ---');

    // 3.1 Verify Private Feedback NEVER appears in Public Reviews
    const publicRes1 = await fetch(`${BASE_URL}/api/public/reviews`);
    const publicData1: any = await publicRes1.json();
    assert('3.1 Public reviews endpoint accessible without auth', publicRes1.status === 200);
    assert(
      '3.1b Private feedback NEVER appears in public reviews response',
      !publicData1.reviews.some((r: any) => r.id === feedbackId || r.content?.includes('5-hour rolling renewal'))
    );
    assert('3.1c Private feedback does NOT inflate public review count', publicData1.count === 0);
    assert('3.1d Public average rating remains null when 0 approved public reviews exist', publicData1.averageRating === null);

    // 3.2 Customer submits a separate public review requiring explicit consent
    const noConsentRes = await fetch(`${BASE_URL}/api/user/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        rating: 5,
        displayName: 'Alex M.',
        content: 'LightningAPI has been rock-solid for our multi-agent pipelines.',
        consentGiven: false, // Refused consent
      }),
    });
    assert('3.2 Public review submission without explicit consent rejected with 400', noConsentRes.status === 400);

    const validReviewRes = await fetch(`${BASE_URL}/api/user/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        rating: 5,
        displayName: 'Alex M.',
        roleOrCompany: 'Staff Infrastructure Engineer',
        content: 'LightningAPI has been rock-solid for our multi-agent pipelines.',
        consentGiven: true,
      }),
    });
    const validReviewData: any = await validReviewRes.json();
    assert('3.2b Public review with explicit consent created with 201', validReviewRes.status === 201);
    reviewId = validReviewData.review?.id;

    // 3.3 Unapproved review is NOT visible to public
    const publicRes2 = await fetch(`${BASE_URL}/api/public/reviews`);
    const publicData2: any = await publicRes2.json();
    assert(
      '3.3 Unapproved public review remains HIDDEN from public endpoint',
      !publicData2.reviews.some((r: any) => r.id === reviewId) && publicData2.count === 0
    );

    // 3.4 Admin approves review
    const approveRes = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isApproved: true, isFeatured: true }),
    });
    assert('3.4 Admin approves public review', approveRes.status === 200);

    // 3.5 Once approved, public review appears in public endpoint without private fields
    const publicRes3 = await fetch(`${BASE_URL}/api/public/reviews`);
    const publicData3: any = await publicRes3.json();
    assert(
      '3.5 Approved review now visible in public reviews endpoint',
      publicRes3.status === 200 && publicData3.reviews.some((r: any) => r.id === reviewId)
    );
    const approvedItem = publicData3.reviews.find((r: any) => r.id === reviewId);
    assert('3.5b Approved review contains approved display name', approvedItem.displayName === 'Alex M.');
    assert('3.5c Approved review contains verified customer badge', approvedItem.verifiedCustomer !== undefined);
    assert('3.5d Public review response NEVER exposes userId or email', approvedItem.userId === undefined && approvedItem.email === undefined);
    assert('3.5e Public count updated accurately', publicData3.count === 1);
    assert('3.5f Public average rating computed accurately from approved reviews', publicData3.averageRating === 5);

    // ------------------------------------------------------------------------
    // SECTION 4: CLEANUP & RETENTION
    // ------------------------------------------------------------------------
    console.log('\n--- Section 4: Deletion & Cleanup ---');
    const deleteFeedbackRes = await fetch(`${BASE_URL}/api/admin/feedback/${feedbackId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('4.1 Admin deletes feedback record', deleteFeedbackRes.status === 200);

    const deleteReviewRes = await fetch(`${BASE_URL}/api/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert('4.2 Admin deletes public review', deleteReviewRes.status === 200);

    // Final check that public endpoint is back to clean state
    const publicResFinal = await fetch(`${BASE_URL}/api/public/reviews`);
    const publicDataFinal: any = await publicResFinal.json();
    assert('4.3 Public reviews clean after deletion', publicDataFinal.count === 0 && publicDataFinal.averageRating === null);
  } finally {
    // Clean up test users
    await prisma.customerFeedback.deleteMany({ where: { userId: { in: [customerUser.id, otherCustomer.id] } } }).catch(() => {});
    await prisma.publicReview.deleteMany({ where: { userId: { in: [customerUser.id, otherCustomer.id] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [customerUser.id, otherCustomer.id, adminUser.id] } } }).catch(() => {});
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFeedbackSystemTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
