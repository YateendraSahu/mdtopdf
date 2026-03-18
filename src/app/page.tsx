'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { parseMarkdown } from '@/lib/markdown';
import WysiwygEditor from '@/components/WysiwygEditor';
import { Download, Loader2, FileText, Moon, Sun, Type, Code, Copy, Eye, Trash2, Leaf, FileStack } from 'lucide-react';


import { useTheme } from 'next-themes';
import { Transition } from '@headlessui/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import mermaid from 'mermaid';


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_MARKDOWN = `# Advanced Markdown Support

This editor now supports **Tables**, **Equations**, and **Mermaid Diagrams**!

## 1. Tables
| Feature | Support | Performance |
| :--- | :---: | ---: |
| Markdown | Fully | High |
| Rich Text | Fully | Smooth |
| PDF Export | Puppeteer | Fast |

## 2. Equations (KaTeX)
The Cauchy-Schwarz Inequality:

\`\`\`math
\\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\leq \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)
\`\`\`

## 3. Flow Blocks (Mermaid)
\`\`\`mermaid
graph TD;
    Markdown -->|Parse| HTML;
    HTML -->|Render| PDF;
    PDF -->|Download| User;
\`\`\`

### Features
- [x] Zero client-side PDF dependencies
- [x] Beautiful KaTeX Math Rendering
- [x] Mermaid Flowcharts & Diagrams
`;



export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [html, setHtml] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'markdown' | 'split'>('split');
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const markdownRef = useRef<HTMLTextAreaElement>(null);
  const visualScrollRef = useRef<HTMLDivElement>(null);

  // Synchronize scroll on click/select (Markdown -> Visual)
  const syncScroll = useCallback(() => {
    if (!markdownRef.current || !visualScrollRef.current || viewMode !== 'split') return;

    const textarea = markdownRef.current;
    const visual = visualScrollRef.current;

    // Calculate percentage of cursor position
    const cursorPosition = textarea.selectionStart;
    const totalLength = textarea.value.length || 1;
    const percentage = cursorPosition / totalLength;

    const targetScroll = (visual.scrollHeight - visual.clientHeight) * percentage;

    // Only scroll preview if user is NOT scrolling the preview themselves
    // and if the difference is significant
    if (Math.abs(visual.scrollTop - targetScroll) > 100) {
      visual.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [viewMode]);

  // Synchronize scroll (Visual -> Markdown)
  const syncVisualToMarkdown = useCallback((percentage: number) => {
    // CRITICAL FIX: Don't scroll the markdown editor if the user is currently typing in it!
    if (!markdownRef.current || viewMode !== 'split' || document.activeElement === markdownRef.current) return;

    const textarea = markdownRef.current;
    const targetScroll = (textarea.scrollHeight - textarea.clientHeight) * percentage;

    if (Math.abs(textarea.scrollTop - targetScroll) > 50) {
      textarea.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [viewMode]);

  useEffect(() => {
    setMounted(true);
    // On mobile, default to Visual (Preview) mode instead of Split
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('visual');
    }
  }, []);

  useEffect(() => {
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
              <FileStack className="w-5 h-5 text-white" />
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
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20",
                isGenerating && "px-8"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="w-full h-[calc(100vh-4rem)] p-4 md:p-6 overflow-hidden">
        <div className="h-full">
          {/* Editor Container */}
          <div className="flex flex-col h-full overflow-hidden rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 dark:shadow-none p-4 md:p-8 transition-all duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Editor</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(markdown);
                      }}
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="Copy Markdown"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to clear all content?')) {
                          setMarkdown('');
                        }
                      }}
                      className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Clear All Content"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 w-full sm:w-auto">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={cn(
                      "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                      viewMode === 'visual'
                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Visual</span>
                  </button>
                  <button
                    onClick={() => setViewMode('markdown')}
                    className={cn(
                      "flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                      viewMode === 'markdown'
                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Markdown</span>
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={cn(
                      "hidden md:flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-md transition-all",
                      viewMode === 'split'
                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Split View</span>
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">{markdown.length} characters</span>
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
              {(viewMode === 'visual' || viewMode === 'split') && (
                <div className={cn("flex-1 min-w-0 transition-all", viewMode === 'split' ? "md:w-1/2" : "w-full")}>
                  <WysiwygEditor value={markdown} onChange={setMarkdown} scrollRef={visualScrollRef} onSelectionChange={syncVisualToMarkdown} />
                </div>
              )}
              {(viewMode === 'markdown' || viewMode === 'split') && (
                <div className={cn("flex-1 min-w-0 transition-all", viewMode === 'split' ? "md:w-1/2" : "w-full focus-within:ring-2 ring-blue-500 rounded-xl")}>
                  <textarea
                    ref={markdownRef}
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    onSelect={syncScroll}
                    onClick={syncScroll}
                    onKeyUp={syncScroll}
                    placeholder="Type your markdown here..."
                    className="w-full h-full bg-white-50/50 dark:bg-slate-950/30 backdrop-blur-sm resize-none focus:outline-none font-mono text-xs md:text-sm leading-relaxed p-4 md:p-6 border border-slate-200 dark:border-slate-800 rounded-xl transition-all"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>




    </div>
  );
}
