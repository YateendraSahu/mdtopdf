'use client';

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer, NodeViewContent, mergeAttributes, Node, nodeInputRule } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { common, createLowlight } from 'lowlight';
import katex from 'katex';
import mermaid from 'mermaid';
import { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Plus,
  Minus,
  Trash2,
  Sigma,
  Activity
} from 'lucide-react';

import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

const lowlight = createLowlight(common);

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onSelectionChange?: (percentage: number) => void;
}

const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${isActive
        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
        : 'hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'
      } disabled:opacity-30`}
  >
    {children}
  </button>
);

const MathInlineComponent = ({ node, updateAttributes }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(node?.attrs?.content || '');

  const mathHtml = katex.renderToString(node?.attrs?.content || '\\dots', {
    throwOnError: false,
    displayMode: false,
  });

  if (isEditing) {
    return (
      <NodeViewWrapper as="span" className="inline-block relative z-50">
        <input
          autoFocus
          className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded px-1.5 py-0.5 text-sm outline-none w-auto min-w-[40px] shadow-sm font-mono"
          value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => {
            updateAttributes({ content: val });
            setIsEditing(false);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              updateAttributes({ content: val });
              setIsEditing(false);
            }
          }}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="span"
      className="inline-block cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 rounded px-1 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
      onClick={() => setIsEditing(true)}
      dangerouslySetInnerHTML={{ __html: mathHtml }}
    />
  );
};

const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      content: {
        default: '',
        parseHTML: element => element.getAttribute('data-content') || element.innerText,
        renderHTML: attributes => ({
          'data-content': attributes?.content || '',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes || {}, { 'data-type': 'math-inline' }), HTMLAttributes?.content || ''];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineComponent);
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\$([^$]+)\$/,
        type: this.type,
        getAttributes: match => ({
          content: match[1],
        }),
      }),
    ];
  },
});

const CodeBlockComponent = ({ node, updateAttributes, extension }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [mermaidHtml, setMermaidHtml] = useState('');
  const { language: lang } = node.attrs;

  // Simple function to decode HTML entities if they sneak into the text content
  const decodeEntities = (text: string) => {
    if (typeof document === 'undefined') return text;
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  useEffect(() => {
    if ((lang === 'mermaid' || lang === 'math') && !isEditing) {
      if (lang === 'mermaid') {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const content = decodeEntities(node.textContent.trim());
        if (!content) {
          setMermaidHtml('<div class="text-slate-400 text-xs italic p-4">Empty Diagram</div>');
          return;
        }
        try {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Inter, system-ui, sans-serif',
            flowchart: {
              useMaxWidth: false,
              htmlLabels: false,
              curve: 'basis',
              padding: 30
            }
          });
          mermaid.render(id, content).then((res) => {
            const html = typeof res === 'string' ? res : (res as any).svg || (res as any).html || '';
            setMermaidHtml(html);
          }).catch(err => {
            // Silently try to render a simpler version or just show error
            setMermaidHtml(`<div class="text-red-500 text-[10px] bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-900/30 font-mono overflow-auto max-h-[200px] whitespace-pre-wrap">Mermaid Syntax Error. Please check your arrows --> and syntax.</div>`);
          });
        } catch (e) {
          setMermaidHtml(`<div class="text-red-500 text-xs text-center p-4">Mermaid Initialization Error</div>`);
        }
      }
    }
  }, [node.textContent, lang, isEditing]);

  const toggleEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(!isEditing);
  }

  if (lang === 'mermaid' && !isEditing) {
    return (
      <NodeViewWrapper className="mermaid-block my-10 relative group cursor-pointer" onClick={toggleEditing}>
        <div className="absolute top-0 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase z-20 shadow-xl border-2 border-white dark:border-slate-900">
          Click to Edit Diagram
        </div>
        <div
          className="flex justify-center p-4 md:p-12 bg-slate-50/20 dark:bg-slate-900/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300 overflow-visible backdrop-blur-sm"
          dangerouslySetInnerHTML={{ __html: mermaidHtml || '<div class="animate-pulse text-slate-400 text-sm">Rendering Diagram...</div>' }}
        />
      </NodeViewWrapper>
    );
  }

  if (lang === 'math' && !isEditing) {
    let mathHtml = '';
    const content = decodeEntities(node.textContent.trim());
    try {
      mathHtml = katex.renderToString(content || '\\text{Empty Equation}', { displayMode: true, throwOnError: false });
    } catch (e) {
      mathHtml = `<div class="text-red-500 text-xs text-center">KaTeX Error</div>`;
    }
    return (
      <NodeViewWrapper className="math-block my-10 relative group cursor-pointer" onClick={toggleEditing}>
        <div className="absolute top-0 right-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase z-20 shadow-xl border-2 border-white dark:border-slate-900">
          Click to Edit Formula
        </div>
        <div
          className="flex justify-center p-4 md:p-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto min-h-[100px] hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-300"
          dangerouslySetInnerHTML={{ __html: mathHtml }}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="code-block my-6 relative group">
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <select
          contentEditable={false}
          value={lang || 'null'}
          onChange={event => updateAttributes({ language: event.target.value })}
          className="bg-slate-800/90 text-white text-[10px] uppercase font-bold px-2 py-1.5 rounded-lg border border-slate-700 outline-none focus:ring-1 ring-blue-500 cursor-pointer shadow-xl backdrop-blur-md"
        >
          <option value="null">plain text</option>
          <option value="math">math (latex)</option>
          <option value="mermaid">mermaid</option>
          {extension.options.lowlight.listLanguages().map((langName: string, index: number) => (
            <option key={index} value={langName}>{langName}</option>
          ))}
        </select>
        {(lang === 'mermaid' || lang === 'math') && (
          <button
            onClick={toggleEditing}
            className="bg-blue-600 text-white text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            Render View
          </button>
        )}
      </div>
      <pre className="p-8 rounded-3xl !bg-slate-950 !text-slate-100 overflow-x-auto border border-slate-800 shadow-2xl font-mono text-sm leading-relaxed">
        <NodeViewContent as={"code" as any} />
      </pre>
    </NodeViewWrapper>
  );
};

export default function WysiwygEditor({ value, onChange, scrollRef, onSelectionChange }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      MathInline,
      Markdown.configure({
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
        transformPastedText: true,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown?.getMarkdown?.() || '';
      onChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      if (onSelectionChange) {
        const { from } = editor.state.selection;
        const size = editor.state.doc.content.size;
        onSelectionChange(from / size);
      }
    },
  });

  useEffect(() => {
    if (editor && !editor.isFocused) {
      const currentMarkdown = (editor.storage as any).markdown?.getMarkdown?.() || '';
      if (value !== currentMarkdown) {
        // Pre-process inline math $...$ into HTML to help Tiptap parse it as our custom node
        const preProcessed = value.replace(/\$([^$]+)\$/g, (match, content) => {
          return `<span data-type="math-inline" data-content="${content.replace(/"/g, '&quot;')}">${content}</span>`;
        });

        // Wrap in setTimeout to avoid React flushSync warning during render lifecycle
        setTimeout(() => {
          if (editor && !editor.isDestroyed && !editor.isFocused) {
            editor.commands.setContent(preProcessed);
          }
        }, 0);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 md:p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            title="Image"
          >
            <ImageIcon className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            isActive={editor.isActive('link')}
            title="Link"
          >
            <LinkIcon className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </MenuButton>

          {editor.isActive('table') && (
            <>
              <MenuButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Add Column"
              >
                <Plus className="w-4 h-4 rotate-90" />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Add Row"
              >
                <Plus className="w-4 h-4" />
              </MenuButton>
              <MenuButton
                onClick={() => editor.chain().focus().deleteTable().run()}
                title="Delete Table"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </MenuButton>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-200 dark:border-slate-800 shrink-0">
          <MenuButton
            onClick={() => {
              editor.chain().focus().toggleCodeBlock({ language: 'math' }).insertContent('e = mc^2').run();
            }}
            title="Insert Equation (Math)"
          >
            <Sigma className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => {
              editor.chain().focus().insertContent({ type: 'mathInline', attrs: { content: 'E=mc^2' } }).run();
            }}
            title="Insert Inline Equation"
          >
            <div className="relative">
              <Sigma className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-slate-900" />
            </div>
          </MenuButton>
          <MenuButton
            onClick={() => {
              // Explicitly send the flow diagram and trigger immediate toggle to render
              editor.chain().focus().toggleCodeBlock({ language: 'mermaid' }).insertContent('graph TD\n  S1[Start] --> S2[Stop]').run();
            }}
            title="Insert Diagram (Mermaid)"
          >
            <Activity className="w-4 h-4" />
          </MenuButton>
        </div>

        <div className="flex items-center gap-1 pl-2 ml-auto shrink-0">
          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </MenuButton>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={scrollRef}
        className="prose prose-slate dark:prose-invert max-w-none flex-1 overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-slate-900 transition-colors"
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
}
