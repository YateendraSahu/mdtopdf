import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { parseMarkdown } from '@/lib/markdown';

// Optional: Rate limiting simple implementation
// For production, use Upstash or similar
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const limit = 5;
  const windowMs = 60 * 1000; // 1 minute

  const record = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - record.lastReset > windowMs) {
    record.count = 1;
    record.lastReset = now;
  } else {
    record.count++;
  }

  rateLimitMap.set(ip, record);
  return record.count > limit;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Max 5 requests per minute.' }, { status: 429 });
    }

    const { markdown } = await req.json();

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json({ error: 'Markdown content is required' }, { status: 400 });
    }

    const htmlContent = await parseMarkdown(markdown);

    // Use a more optimized HTML/CSS structure
    // - System fonts instead of Google Fonts (saves 300KB+)
    // - Minimal Tailwind Typography
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
          <style>
            @page { 
              margin: 1.5cm 0.75cm; 
              size: A4; 
            }
            body { 
              font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
              line-height: 1.6;
              color: #334155;
            }
            h1, h2, h3 {
              color: #1e40af !important; /* Deep blue headings */
              font-weight: 800 !important;
              letter-spacing: -0.025em !important;
            }
            .prose { 
              max-width: none !important; 
              width: 100% !important; 
              font-size: 11pt; /* More standard for PDF */
            }
            pre { 
              white-space: pre-wrap !important; 
              word-break: break-all !important; 
              font-size: 9.5pt;
              padding: 1.25rem !important;
              border-radius: 0.75rem !important;
              background-color: #0f172a !important;
              color: #f1f5f9 !important;
              border: 1px solid #1e293b !important;
            }
            code {
              color: #e2e8f0 !important;
              background-color: transparent !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            }
            .prose :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
              background-color: #0f172a !important;
              color: #f1f5f9 !important;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 1rem;
              margin-top: 2rem;
              margin-bottom: 2rem;
              image-rendering: -webkit-optimize-contrast;
            }
          </style>
        </head>
        <body class="p-8 bg-white">
          <article class="prose prose-slate mx-auto">
            ${htmlContent}
          </article>
        </body>
      </html>
    `;

    // Determine if we are running locally (Windows) or in production (Vercel/Linux)
    const isLocal = process.env.NODE_ENV === 'development' || process.platform === 'win32';

    let executablePath: string;
    if (isLocal) {
      // Local Windows paths (Edge is usually available)
      executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    } else {
      executablePath = await chromium.executablePath();
    }

    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      executablePath: executablePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true, // Respect @page rules in CSS
      margin: {
        top: '1.5cm',
        right: '0.75cm',
        bottom: '1.5cm',
        left: '0.75cm',
      },
    });

    await browser.close();

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="document.pdf"',
      },
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Ensure proper CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
