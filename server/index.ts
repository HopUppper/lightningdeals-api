import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import { handleMessagesEndpoint } from './gateway';
import { handleCheckKeyStatus, handleSystemStatus, handleGetModels, handleCountTokens, handleWebSearch, handleUnderstandImage } from './tools';
import adminRouter from './admin';
import userRouter from './user';
import { prisma } from './db';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (Render / Cloudflare) to extract true client IP
app.set('trust proxy', true);

// CORS Hardening
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://lightningapi.pro',
  'https://www.lightningapi.pro',
  'https://api.lightningapi.pro',
  'https://lightningdeals-api.onrender.com',
  process.env.VITE_APP_URL || 'https://lightningdeals.ai',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.lightningapi.pro') ||
        origin.endsWith('.onrender.com') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';");
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// 1. Anthropic-Compatible API Gateway
app.post('/v1/messages', handleMessagesEndpoint);
app.get('/v1/models', handleGetModels);
app.post('/v1/messages/count_tokens', handleCountTokens);

// 2. Built-in Tools Endpoints
app.post('/tools/web_search', handleWebSearch);
app.post('/tools/understand_image', handleUnderstandImage);

// 3. Public System & Key Status Tools
app.get('/api/key-status', handleCheckKeyStatus);
app.get('/api/system/status', handleSystemStatus);


// Public Pricing Packages for Frontend
app.get('/api/pricing/packages', async (req, res) => {
  try {
    const packages = await prisma.tokenPackage.findMany({
      where: { enabled: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(packages.map((p) => ({ ...p, tokenAmount: p.tokenAmount.toString() })));
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// 3. User & Admin Routes
app.use('/api', userRouter);
app.use('/api/admin', adminRouter);

// 4. One-line Terminal Setup Scripts
app.get('/setup.sh', (req, res) => {
  const baseUrl = process.env.LIGHTNINGDEALS_API_URL || 'https://lightningapi.pro';
  res.type('text/plain').send(`#!/bin/bash
echo "⚡ Setting up LightningDeals AI API Gateway..."
read -p "Enter your LightningDeals API key (ld_live_...): " LD_KEY
export ANTHROPIC_BASE_URL="${baseUrl}"
export ANTHROPIC_AUTH_TOKEN="$LD_KEY"
echo "✅ Configuration saved to environment!"
echo "Run 'claude' to start coding with LightningDeals."
`);
});

app.get('/setup.ps1', (req, res) => {
  const baseUrl = process.env.LIGHTNINGDEALS_API_URL || 'https://lightningapi.pro';
  res.type('text/plain').send(`Write-Host "⚡ Setting up LightningDeals AI API Gateway..." -ForegroundColor Cyan
$key = Read-Host "Enter your LightningDeals API key (ld_live_...)"
[Environment]::SetEnvironmentVariable("ANTHROPIC_BASE_URL", "${baseUrl}", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", $key, "User")
Write-Host "✅ Configuration saved to environment variables!" -ForegroundColor Green
Write-Host "Run 'claude' to start coding with LightningDeals."
`);
});


import fs from 'fs';

// 5. Static Web Application & SSG / SSR Pre-rendered Route Serving
const distPath = path.resolve(import.meta.dirname, '../dist');
console.log('⚡ Static web assets path:', distPath);

app.use('/assets', express.static(path.join(distPath, 'assets')));
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/v1')) {
    return res.status(404).json({ error: { message: 'Endpoint not found.' } });
  }

  const cleanPath = req.path.replace(/^\//, '').replace(/\/$/, '');
  const sectionName = cleanPath.split('/')[0];
  const htmlFileName = sectionName ? `${sectionName}.html` : 'index.html';
  const targetHtmlPath = path.join(distPath, htmlFileName);

  if (fs.existsSync(targetHtmlPath)) {
    return res.sendFile(targetHtmlPath);
  }

  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('<!DOCTYPE html><html><body><h1>LightningDeals API Gateway Server Active</h1></body></html>');
    }
  });
});




app.listen(PORT, () => {
  console.log(`🚀 LightningDeals Backend API Gateway running on https://lightningapi.pro`);
});


