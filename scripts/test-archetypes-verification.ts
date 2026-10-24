import { synthesizeByArchetype, detectProjectArchetype } from '../server/studioBuilderArchetypes';
import { compilePreviewBundle, validateProjectBundle } from '../server/studioBuilder';

function verify() {
  console.log('--- Testing Archetype Detection & Synthesis ---');

  // 1. Design Director Portfolio
  const portfolioPrompt = 'Build a premium portfolio website for a design director. Create an editorial hero, a visually rich project gallery with distinct project thumbnails, project categories, detailed case-study sections, a biography, selected skills, and a contact form.';
  const pCat = detectProjectArchetype(portfolioPrompt);
  console.log('Portfolio detected archetype:', pCat);
  if (pCat !== 'portfolio') throw new Error('Failed to detect portfolio archetype');

  const pFiles = synthesizeByArchetype(portfolioPrompt, pCat);
  console.log('Portfolio generated files count:', pFiles.length);
  pFiles.forEach(f => console.log(' - File:', f.path, 'Size:', f.content.length));

  const pVal = validateProjectBundle(pFiles);
  console.log('Portfolio validation:', pVal);
  if (!pVal.valid) throw new Error('Portfolio bundle invalid: ' + pVal.errors.join(', '));

  const pPreview = compilePreviewBundle(pFiles);
  console.log('Portfolio compiled preview HTML size:', pPreview.length);
  if (!pPreview.includes('Design Director')) throw new Error('Missing Design Director in preview');
  if (!pPreview.includes('Aether OS — Spatial Computing Design System')) throw new Error('Missing Aether OS project');
  if (!pPreview.includes('caseStudyModal')) throw new Error('Missing caseStudyModal');
  if (!pPreview.includes('data:image/svg+xml')) throw new Error('Missing inlined SVGs in preview bundle');

  // 2. SaaS Analytics Dashboard
  const dashPrompt = 'Build a responsive SaaS analytics dashboard application. Include KPI metric cards with trends, an interactive monthly revenue bar chart, a dedicated Revenue Breakdown by Stream section, a searchable and filterable transaction table with live status counts, and a working CSV export handler.';
  const dCat = detectProjectArchetype(dashPrompt);
  console.log('\nDashboard detected archetype:', dCat);
  if (dCat !== 'dashboard') throw new Error('Failed to detect dashboard archetype');

  const dFiles = synthesizeByArchetype(dashPrompt, dCat);
  console.log('Dashboard generated files count:', dFiles.length);
  dFiles.forEach(f => console.log(' - File:', f.path, 'Size:', f.content.length));

  const dVal = validateProjectBundle(dFiles);
  console.log('Dashboard validation:', dVal);
  if (!dVal.valid) throw new Error('Dashboard bundle invalid: ' + dVal.errors.join(', '));

  const dPreview = compilePreviewBundle(dFiles);
  console.log('Dashboard compiled preview HTML size:', dPreview.length);
  if (!dPreview.includes('Revenue Breakdown by Stream')) throw new Error('Missing Revenue Breakdown by Stream');
  if (!dPreview.includes('tableRecordCount')) throw new Error('Missing tableRecordCount');
  if (!dPreview.includes('sales-analytics-2026.csv')) throw new Error('Missing CSV export handler');

  // 3. South Indian Restaurant
  const restPrompt = 'Build an authentic South Indian dining website for Dakshin Rasoi in Indiranagar Bengaluru with heritage menu categories, crisp ghee roast dosai, and table booking.';
  const rCat = detectProjectArchetype(restPrompt);
  console.log('\nRestaurant detected archetype:', rCat);
  if (rCat !== 'restaurant') throw new Error('Failed to detect restaurant archetype');

  const rFiles = synthesizeByArchetype(restPrompt, rCat);
  console.log('Restaurant generated files count:', rFiles.length);
  const rVal = validateProjectBundle(rFiles);
  console.log('Restaurant validation:', rVal);
  if (!rVal.valid) throw new Error('Restaurant bundle invalid: ' + rVal.errors.join(', '));

  console.log('\n✅ ALL 3 ARCHETYPES VERIFIED PERFECTLY WITH ZERO DEFECTS!');
}

verify();
