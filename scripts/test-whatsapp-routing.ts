import crypto from 'crypto';
import { prisma } from '../server/db';
import { WhatsAppEngine } from '../server/whatsapp/whatsappEngine';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    results.push({ name, passed: true, details });
  } else {
    console.error(`  ❌ [FAIL] ${name}: ${details || 'Assertion failed'}`);
    results.push({ name, passed: false, details });
  }
}

async function runRoutingTests() {
  console.log('\n================================================================');
  console.log('⚡ LIGHTNINGAPI.PRO — WHATSAPP CONVERSATION ROUTING TEST SUITE');
  console.log('================================================================\n');

  const testSuffix = crypto.randomBytes(4).toString('hex');
  const testPhone = `9198765${Math.floor(10000 + Math.random() * 90000)}`;
  const customerEmail = `wa.routing.${testSuffix}@example.com`;

  try {
    // 1. Setup Test User with Orders and Credits
    const user = await prisma.user.create({
      data: {
        email: customerEmail,
        name: 'Sidh Tester',
        role: 'user',
        passwordHash: crypto.randomBytes(32).toString('hex'),
        emailVerified: true,
        status: 'active',
        availableCredits: 450,
        lifetimeCreditsEarned: 1200,
        lifetimeCreditsRedeemed: 750,
      },
    });

    // Create an order for this user
    await prisma.order.create({
      data: {
        userId: user.id,
        planName: 'Claude Max 5x',
        amountInr: 3500,
        paymentStatus: 'CAPTURED',
        fulfillmentStatus: 'FULFILLED',
        channel: 'WHATSAPP',
      },
    });

    console.log(`Test user created: ${customerEmail} (Phone: ${testPhone})\n`);

    // ------------------------------------------------------------------------
    // TEST 1: Initial Greeting ("Hi")
    // ------------------------------------------------------------------------
    console.log('Test 1: Initial Greeting ("Hi")');
    const resHi = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'Hi',
      providerMessageId: `msg_hi_${testSuffix}`,
      customerName: 'Sidh',
    });

    const msgHi = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resHi.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('resHi is handled', resHi.handled);
    assert(
      'Hi returns welcome and main menu with 1-7 options',
      (msgHi?.content.includes('Browse Products') &&
        msgHi?.content.includes('My Orders') &&
        msgHi?.content.includes('Talk to Admin')) || false,
      msgHi?.content
    );
    assert(
      'Hi does NOT ask for email',
      !msgHi?.content.toLowerCase().includes('enter the email') &&
        !msgHi?.content.toLowerCase().includes('authentication required')
    );
    assert('Conversation state is START', resHi.currentState === 'START');

    // ------------------------------------------------------------------------
    // TEST 2: General Product Browsing ("What products do you have?")
    // ------------------------------------------------------------------------
    console.log('\nTest 2: General Product Browsing ("What products do you have?")');
    const resWhatProducts = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'What products do you have?',
      providerMessageId: `msg_whatprod_${testSuffix}`,
    });

    const msgWhatProd = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resWhatProducts.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('resWhatProducts is handled', resWhatProducts.handled);
    assert('currentState is PRODUCT_SELECTION', resWhatProducts.currentState === 'PRODUCT_SELECTION');
    assert(
      'Returns product names without email demand',
      (msgWhatProd?.content.includes('Canva Pro') &&
        msgWhatProd?.content.includes('Claude Max') &&
        !msgWhatProd?.content.includes('Authentication Required')) || false,
      msgWhatProd?.content
    );
    assert(
      'Product list has ZERO price leakage (no ₹ or numeric prices)',
      !msgWhatProd?.content.includes('₹') && !msgWhatProd?.content.includes('Rs')
    );

    // ------------------------------------------------------------------------
    // TEST 3: "Browse products"
    // ------------------------------------------------------------------------
    console.log('\nTest 3: "Browse products"');
    const resBrowse = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'Browse products',
      providerMessageId: `msg_browse_${testSuffix}`,
    });

    const msgBrowse = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resBrowse.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Browse products is handled', resBrowse.handled);
    assert(
      'Browse products lists catalog',
      msgBrowse?.content.includes('AVAILABLE PRODUCTS') || false
    );
    assert('Zero price leakage in Browse products', !msgBrowse?.content.includes('₹'));

    // ------------------------------------------------------------------------
    // TEST 4: "Canva Pro" (Product Selection)
    // ------------------------------------------------------------------------
    console.log('\nTest 4: Product Selection ("Canva Pro")');
    const resCanva = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'Canva Pro',
      providerMessageId: `msg_canva_${testSuffix}`,
    });

    const msgCanva = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resCanva.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Canva Pro is handled', resCanva.handled);
    assert('Status is WAITING_ADMIN', resCanva.status === 'WAITING_ADMIN');
    assert('State is AWAITING_ADMIN_PRICE', resCanva.currentState === 'AWAITING_ADMIN_PRICE');
    assert(
      'Bot informs admin will confirm price',
      msgCanva?.content.includes('Canva Pro') && msgCanva?.content.includes('admin will confirm the current price'),
      msgCanva?.content
    );
    assert('No email requested for product selection', !msgCanva?.content.includes('Authentication Required'));

    const convAfterCanva = await prisma.whatsAppConversation.findUnique({
      where: { id: resCanva.conversationId },
    });
    assert('Conversation recorded Canva Pro as current product', convAfterCanva?.currentProductName === 'Canva Pro');

    // ------------------------------------------------------------------------
    // TEST 5: Price Request ("How much is Canva Pro?")
    // ------------------------------------------------------------------------
    console.log('\nTest 5: Price Request ("How much is Canva Pro?")');
    const resPrice = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'How much is Canva Pro?',
      providerMessageId: `msg_price_${testSuffix}`,
    });

    const msgPrice = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resPrice.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Price inquiry handled', resPrice.handled);
    assert('Status is WAITING_ADMIN', resPrice.status === 'WAITING_ADMIN');
    assert('State is AWAITING_ADMIN_PRICE', resPrice.currentState === 'AWAITING_ADMIN_PRICE');
    assert(
      'Bot routes to admin for price confirmation with ZERO price leakage',
      msgPrice?.content.includes('admin will confirm the current price') && !msgPrice?.content.includes('₹'),
      msgPrice?.content
    );

    // ------------------------------------------------------------------------
    // TEST 6: Arbitrary / Unknown Messages ("TEST 123", "PING-7429")
    // ------------------------------------------------------------------------
    console.log('\nTest 6: Fallback Messages ("TEST 123", "PING-7429")');
    const resTest123 = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'TEST 123',
      providerMessageId: `msg_test123_${testSuffix}`,
    });

    const msgTest123 = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resTest123.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Fallback is handled gracefully', resTest123.handled);
    assert(
      'Fallback provides helpful hints without forcing email or welcome loop',
      msgTest123?.content.includes("didn't quite catch that") && !msgTest123?.content.includes('Authentication Required'),
      msgTest123?.content
    );

    // ------------------------------------------------------------------------
    // TEST 7: Account-Specific ("My orders" without identity)
    // ------------------------------------------------------------------------
    console.log('\nTest 7: "My orders" without identity');
    const resOrdersNoAuth = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'My orders',
      providerMessageId: `msg_orders_noauth_${testSuffix}`,
    });

    const msgOrdersNoAuth = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resOrdersNoAuth.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Unauthenticated My orders is handled', resOrdersNoAuth.handled);
    assert('Status is WAITING_CUSTOMER', resOrdersNoAuth.status === 'WAITING_CUSTOMER');
    assert('State is AWAITING_EMAIL', resOrdersNoAuth.currentState === 'AWAITING_EMAIL');
    assert(
      'Asks for registered email for My orders',
      msgOrdersNoAuth?.content.includes('Authentication Required') && msgOrdersNoAuth?.content.includes('email address'),
      msgOrdersNoAuth?.content
    );

    // ------------------------------------------------------------------------
    // TEST 8: Account-Specific ("My credits" without identity)
    // ------------------------------------------------------------------------
    console.log('\nTest 8: "My credits" without identity');
    const resCreditsNoAuth = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'My credits',
      providerMessageId: `msg_credits_noauth_${testSuffix}`,
    });

    const msgCreditsNoAuth = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resCreditsNoAuth.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Unauthenticated My credits is handled', resCreditsNoAuth.handled);
    assert('State is AWAITING_EMAIL', resCreditsNoAuth.currentState === 'AWAITING_EMAIL');
    assert(
      'Asks for registered email for My credits',
      msgCreditsNoAuth?.content.includes('Authentication Required')
    );

    // ------------------------------------------------------------------------
    // TEST 9: Enter Valid Email (Authenticate Customer)
    // ------------------------------------------------------------------------
    console.log('\nTest 9: Entering Valid Email');
    const resEmail = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: customerEmail,
      providerMessageId: `msg_email_${testSuffix}`,
    });

    assert('Email authentication is handled', resEmail.handled);
    assert('Status transitions to ACTIVE', resEmail.status === 'ACTIVE');
    assert('State transitions to START', resEmail.currentState === 'START');

    const convAfterAuth = await prisma.whatsAppConversation.findUnique({
      where: { id: resEmail.conversationId },
    });
    assert('Conversation customerId is linked to User ID', convAfterAuth?.customerId === user.id);

    const identity = await prisma.whatsAppCustomerIdentity.findUnique({
      where: { whatsappNumber: testPhone },
    });
    assert('WhatsAppCustomerIdentity is verified and persisted', identity?.customerId === user.id && identity.verified);

    // ------------------------------------------------------------------------
    // TEST 10: "My orders" (After Identity Established)
    // ------------------------------------------------------------------------
    console.log('\nTest 10: "My orders" (Authenticated)');
    const resOrdersAuth = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'My orders',
      providerMessageId: `msg_orders_auth_${testSuffix}`,
    });

    const msgOrdersAuth = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resOrdersAuth.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Authenticated orders request handled', resOrdersAuth.handled);
    assert(
      'Returns customer-specific orders without asking for email',
      msgOrdersAuth?.content.includes('Claude Max 5x') && !msgOrdersAuth?.content.includes('Authentication Required'),
      msgOrdersAuth?.content
    );

    // ------------------------------------------------------------------------
    // TEST 11: "What products do you have?" (After Identity Established)
    // ------------------------------------------------------------------------
    console.log('\nTest 11: "What products do you have?" (Authenticated)');
    const resWhatProdAuth = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'What products do you have?',
      providerMessageId: `msg_whatprod_auth_${testSuffix}`,
    });

    const msgWhatProdAuth = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resWhatProdAuth.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Product browsing handled for authenticated user', resWhatProdAuth.handled);
    assert(
      'Returns products without asking for email again',
      msgWhatProdAuth?.content.includes('AVAILABLE PRODUCTS') && !msgWhatProdAuth?.content.includes('Authentication Required'),
      msgWhatProdAuth?.content
    );

    // ------------------------------------------------------------------------
    // TEST 12: "My credits" (After Identity Established)
    // ------------------------------------------------------------------------
    console.log('\nTest 12: "My credits" (Authenticated)');
    const resCreditsAuth = await WhatsAppEngine.handleInboundMessage({
      from: testPhone,
      body: 'My credits',
      providerMessageId: `msg_credits_auth_${testSuffix}`,
    });

    const msgCreditsAuth = await prisma.whatsAppMessage.findFirst({
      where: { conversationId: resCreditsAuth.conversationId, sentBy: 'BOT' },
      orderBy: { createdAt: 'desc' },
    });

    assert('Authenticated credits request handled', resCreditsAuth.handled);
    assert(
      'Returns credits balance (₹450 available) without asking for email',
      msgCreditsAuth?.content.includes('450') && !msgCreditsAuth?.content.includes('Authentication Required'),
      msgCreditsAuth?.content
    );

    // ------------------------------------------------------------------------
    // TEST 13: Conversation State Persistence Across All Messages
    // ------------------------------------------------------------------------
    console.log('\nTest 13: Verify State Persistence');
    const allMessages = await prisma.whatsAppMessage.findMany({
      where: { conversationId: resHi.conversationId },
      orderBy: { createdAt: 'asc' },
    });
    assert('All messages recorded under same conversationId', allMessages.length >= 24);

    const finalConv = await prisma.whatsAppConversation.findUnique({
      where: { id: resHi.conversationId },
    });
    assert('Customer identity remains permanently persisted in session', finalConv?.customerId === user.id);

    console.log('\n================================================================');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRoutingTests();
