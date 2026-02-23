'use client';

import { useState, useEffect } from 'react';
import { parseMarkdown } from '@/lib/markdown';
import { Download, Eye, Edit3, Loader2, FileText, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Transition } from '@headlessui/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_MARKDOWN = `# Hello Markdown to PDF!

This is a **production-ready** generator built with Next.js 15.

## Features
- [x] Zero client-side PDF dependencies
- [x] Server-side rendering with Puppeteer
- [x] GitHub Flavored Markdown
- [x] Dark mode support
- [x] Beautiful typography

### Code Example
\`\`\`javascript
const greeting = "Hello World";
console.log(greeting);
\`\`\`

> "Simplicity is the soul of efficiency." — Austin Freeman

![Sample Image](https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=400&q=80)
`;

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [html, setHtml] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updatePreview = async () => {
      const parsed = await parseMarkdown(markdown);
      setHtml(parsed);
    };
    updatePreview();
  }, [markdown]);

  if (!mounted) return null;

  const handleGeneratePDF = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">MD<span className="text-blue-600">to</span>PDF</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {isPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreview ? 'Edit' : 'Preview'}
            </button>

            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20",
                isGenerating && "px-8"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 gap-6 h-full">
          <div className="relative h-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* Editor */}
            <div className={cn(
              "absolute inset-0 transition-all duration-300 p-6 flex flex-col",
              isPreview ? "opacity-0 pointer-events-none translate-x-4" : "opacity-100 translate-x-0"
            )}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Markdown Editor</span>
                <span className="text-xs text-slate-400">{markdown.length} characters</span>
              </div>
              <textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type your markdown here..."
                className="flex-1 w-full bg-transparent resize-none focus:outline-none font-mono text-sm leading-relaxed"
              />
            </div>

            {/* Preview */}
            <div className={cn(
              "absolute inset-0 transition-all duration-300 p-6 overflow-y-auto custom-scrollbar",
              isPreview ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none -translate-x-4"
            )}>
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Live Preview</span>
              </div>
              <div
                className="prose prose-slate dark:prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:dark:bg-slate-800 prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
