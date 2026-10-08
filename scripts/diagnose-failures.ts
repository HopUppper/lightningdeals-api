import { KnowledgeService } from '../server/whatsapp/ai/knowledgeService';

async function diagnose() {
  const tests = [
    { cat: 'PRODUCT RECOMMENDATIONS', name: 'Office and spreadsheet worker', input: 'tool for excel and word documents', check: (r: string) => r.toLowerCase().includes('microsoft') },
    { cat: 'PRODUCT RECOMMENDATIONS', name: 'Student looking for courses', input: 'online certifications and university courses', check: (r: string) => r.toLowerCase().includes('coursera') },
    { cat: 'PRODUCT RECOMMENDATIONS', name: 'Professional networking', input: 'job search and recruiter messaging tool', check: (r: string) => r.toLowerCase().includes('linkedin') },
    { cat: 'ACTIVATION', name: 'Canva Pro activation procedure', input: 'how does canva activation work', check: (r: string) => r.toLowerCase().includes('email') && !r.toLowerCase().includes('password') },
    { cat: 'ACTIVATION', name: 'TradingView activation', input: 'how do i activate tradingview', check: (r: string) => r.toLowerCase().includes('voucher') || r.toLowerCase().includes('invite') },
    { cat: 'ACTIVATION', name: 'Can I use personal email', input: 'can i use my own personal email', check: (r: string) => r.toLowerCase().includes('yes') || r.toLowerCase().includes('own') },
    { cat: 'PAYMENT', name: 'Credit and debit card support', input: 'do you accept visa mastercard', check: (r: string) => r.toLowerCase().includes('card') },
    { cat: 'PAYMENT', name: 'Money deducted but pending', input: 'money deducted from bank but order pending', check: (r: string) => r.toLowerCase().includes('sync') || r.toLowerCase().includes('minute') },
    { cat: 'PAYMENT', name: 'Currency supported', input: 'what currency do you charge in', check: (r: string) => r.toLowerCase().includes('inr') || r.includes('₹') },
    { cat: 'PAYMENT', name: 'Pay later inquiry', input: 'can i pay after delivery', check: (r: string) => r.toLowerCase().includes('prepaid') || r.toLowerCase().includes('before') },
    { cat: 'ORDERS', name: 'Order delivery method', input: 'where will i receive the order credentials', check: (r: string) => r.toLowerCase().includes('chat') || r.toLowerCase().includes('email') },
    { cat: 'API SUPPORT', name: 'Python integration example', input: 'how do i call the api in python', check: (r: string) => r.toLowerCase().includes('bearer') || r.toLowerCase().includes('requests') },
    { cat: 'API SUPPORT', name: 'Node.js integration example', input: 'how do i call the api in node js', check: (r: string) => r.toLowerCase().includes('fetch') || r.toLowerCase().includes('headers') },
    { cat: 'API SUPPORT', name: 'Streaming SSE support', input: 'does your api support stream: true', check: (r: string) => r.toLowerCase().includes('stream') || r.toLowerCase().includes('yes') },
    { cat: 'REWARDS', name: 'Redeem credits for discount', input: 'can i redeem credits to discount renewal', check: (r: string) => r.toLowerCase().includes('yes') },
    { cat: 'REFUNDS', name: 'Refund payment channel', input: 'where is the refund credited to', check: (r: string) => r.toLowerCase().includes('bank') || r.toLowerCase().includes('source') || r.toLowerCase().includes('payu') },
    { cat: 'CONTEXT RETENTION', name: 'Cursor -> Codebase indexing', input: 'how does cursor index my codebase', check: (r: string) => r.toLowerCase().includes('cursor') || r.toLowerCase().includes('index') },
    { cat: 'CONTEXT RETENTION', name: 'Referral -> Friend link share context', input: 'can my friend click my link and sign up directly', check: (r: string) => r.toLowerCase().includes('link') || r.toLowerCase().includes('referral') },
  ];

  console.log('Diagnosing 18 failed RAG knowledge searches...\n');

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    const results = await KnowledgeService.searchKnowledge(t.input, undefined, 2);
    const text = results.map((r) => `${r.title}: ${r.content}`).join(' ');
    const passed = t.check(text || 'Standard helpful response');
    
    console.log(`[${i + 1}/18] ${t.cat} -> ${t.name}`);
    console.log(`Input: "${t.input}"`);
    console.log(`Passed: ${passed}`);
    console.log(`Retrieved count: ${results.length}`);
    if (results.length > 0) {
      console.log(`Titles: ${results.map(r => r.title).join(', ')}`);
      console.log(`Snippet: ${text.substring(0, 160)}...`);
    } else {
      console.log('No results retrieved!');
    }
    console.log('--------------------------------------------------');
  }
}

diagnose().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
