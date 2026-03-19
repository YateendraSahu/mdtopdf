import { NextRequest, NextResponse } from 'next/server';
import { parseMarkdown } from '@/lib/markdown';

// Optional: Rate limiting simple implementation
// For production, use Upstash or similar
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export const maxDuration = 60; // Increase timeout for PDF generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  let browser: any = null;
  try {
    // Dynamically import Puppeteer and Chromium only when needed
    // This reduces the cold-start package size and avoids local conflicts
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = await import('@sparticuz/chromium');

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
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
          <style>
            @page { 
              margin: 1.25cm 1cm; 
              size: A4; 
            }
            body { 
              font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
              line-height: 1.3;
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
              line-height: 1.4 !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            .prose p {
              margin-top: 0.5rem !important;
              margin-bottom: 0.5rem !important;
            }
            .prose h1, .prose h2, .prose h3 {
              margin-top: 1.25rem !important;
              margin-bottom: 0.5rem !important;
            }
            .prose ul, .prose ol {
              margin-top: 0.5rem !important;
              margin-bottom: 0.5rem !important;
            }
            .prose li {
              margin-top: 0.125rem !important;
              margin-bottom: 0.125rem !important;
            }
            pre { 
              white-space: pre-wrap !important; 
              word-break: break-all !important; 
              font-size: 9.5pt;
              padding: 1rem !important;
              margin-top: 0.75rem !important;
              margin-bottom: 0.75rem !important;
              border-radius: 0.5rem !important;
              background-color: #0f172a !important;
              color: #f1f5f9 !important;
              border: 1px solid #1e293b !important;
            }
            code {
              color: #f1f5f9 !important;
              background-color: transparent !important;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            }
            .prose code {
              background-color: transparent !important;
              color: inherit !important;
              font-weight: 500 !important;
            }
            .prose code::before,
            .prose code::after {
              content: "" !important;
            }
            .prose :where(pre):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
              background-color: #0f172a !important;
              color: #f1f5f9 !important;
              line-height: 1.5 !important;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 0.75rem;
              margin-top: 1rem;
              margin-bottom: 1rem;
              image-rendering: -webkit-optimize-contrast;
            }
            /* Modern Premium Table Styling */
            table { 
              width: 100%; 
              border-collapse: separate; 
              border-spacing: 0;
              margin-top: 2rem; 
              margin-bottom: 2rem; 
              font-size: 10pt;
              border: 1px solid #e2e8f0;
              border-radius: 0.75rem;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            th { 
              background-color: #f8fafc; 
              font-weight: 700; 
              color: #1e40af; 
              border-bottom: 1px solid #e2e8f0;
              padding: 1rem 0.75rem;
              text-align: left;
              text-transform: uppercase;
              font-size: 8.5pt;
              letter-spacing: 0.05em;
            }
            td { 
              border-bottom: 1px solid #f1f5f9; 
              padding: 0.875rem 0.75rem; 
              vertical-align: middle;
              color: #475569;
            }
            tr:last-child td {
              border-bottom: none;
            }
            tr:nth-child(even) {
              background-color: #fbfcfe;
            }
          </style>
        </head>
        <body class="bg-white">
          <article class="prose prose-slate mx-auto">
            ${htmlContent}
          </article>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
          <script>
            // Helper to decode HTML entities like &gt; back to >
            function decodeEntities(text) {
              const textArea = document.createElement('textarea');
              textArea.innerHTML = text;
              return textArea.value;
            }

            // Special handling for mermaid diagrams in pre blocks
            document.querySelectorAll('pre code.language-mermaid').forEach(el => {
              const pre = el.parentElement;
              const div = document.createElement('div');
              div.className = 'mermaid';
              div.textContent = decodeEntities(el.textContent);
              pre.replaceWith(div);
            });
            
            // Special handling for KaTeX math in pre blocks
            document.querySelectorAll('pre code.language-math').forEach(el => {
              const pre = el.parentElement;
              const div = document.createElement('div');
              div.className = 'katex-block my-4 text-center';
              try {
                div.innerHTML = katex.renderToString(el.textContent, {
                  displayMode: true,
                  throwOnError: false
                });
                pre.replaceWith(div);
              } catch (e) {
                console.error('KaTeX error:', e);
              }
            });

            // Special handling for inline math spans
            document.querySelectorAll('span[data-type="math-inline"]').forEach(el => {
              const content = el.getAttribute('data-content') || el.textContent;
              try {
                el.innerHTML = katex.renderToString(content, {
                  displayMode: false,
                  throwOnError: false
                });
              } catch (e) {
                console.error('Inline KaTeX error:', e);
              }
            });

            mermaid.initialize({ 
              startOnLoad: true, 
              theme: 'neutral',
              flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
              securityLevel: 'loose',
              fontFamily: 'system-ui, sans-serif'
            });
          </script>
        </body>
      </html>
    `;

    const isLocal = process.env.NODE_ENV === 'development' || process.platform === 'win32';

    let executablePath: string;
    if (isLocal) {
      // Try multiple common local browser paths for Windows
      const paths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      ];
      
      executablePath = paths[0]; 
      console.log('Local Mode: Using browser at:', executablePath);
    } else {
      // Production Mode: Vercel/Linux
      executablePath = await chromium.executablePath();
    }

    try {
      browser = await puppeteer.launch({
        args: isLocal ? ['--no-sandbox', '--disable-setuid-sandbox'] : [
            ...chromium.args,
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Often needed for Lambda environments like Netlify
          ],
        executablePath: executablePath,
        headless: isLocal ? true : (chromium as any).headless || true,
        defaultViewport: (chromium as any).defaultViewport || { width: 1200, height: 800 },
      });
    } catch (e: any) {
       console.error('Browser Launch Error:', e.message);
       // Attempt to re-launch once with minimal args if it failed
       if (!isLocal) {
         try {
           browser = await puppeteer.launch({
             args: [...chromium.args, '--no-sandbox'],
             executablePath: executablePath,
             headless: true,
           });
         } catch (e2: any) {
           throw new Error(`Puppeteer failed on Server: ${e.message}`);
         }
       } else {
          throw e;
       }
    }

    const page = await browser.newPage();
    // Use 'load' instead of 'networkidle0' to save time, 
    // we'll handle mermaid specifically
    await page.setContent(fullHtml, { waitUntil: 'load' });

    // Give mermaid diagrams and KaTeX time to finish rendering
    // Optimized for Vercel's 10s (Hobby) timeout limit
    await new Promise(resolve => setTimeout(resolve, 1500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 8pt; width: 100%; text-align: center; color: #94a3b8; font-family: system-ui, sans-serif; padding-bottom: 5px;">
         Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      preferCSSPageSize: true, // Respect @page rules in CSS
      margin: {
        top: '1.5cm',
        right: '1cm',
        bottom: '1.5cm',
        left: '1cm',
      },
    });






    return new NextResponse(Buffer.from(pdfBuffer), {
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
  } finally {
     if (browser) {
       await browser.close();
     }
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
