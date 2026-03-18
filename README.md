# MDtoPDF: Premium Markdown & Visual Editor

MDtoPDF is a state-of-the-art Markdown editor that bridges the gap between raw data and professional PDF documents. It features a unique dual-mode editing experience with real-time synchronization, mathematical formula support, and complex diagram rendering.

## ✨ Key Features

- **🚀 Dual Editing Modes**: Seamlessly switch between a high-performance **Markdown Editor** and a premium **Visual (WYSIWYG) Editor**.
- **📊 Complex Diagrams**: Native support for **Mermaid.js** diagrams (Flowcharts, Sequence Diagrams, Gantt charts, etc.) directly in the editor.
- **∑ Mathematical Precision**: Full **KaTeX** integration for both inline ($E=mc^2$) and block-level complex equations.
- **📄 Pro-Grade PDF Export**: Generates pixel-perfect A4 PDFs using an optimized Puppeteer-based serverless pipeline.
- **🔄 Intelligent Sync**: Bidirectional scroll and cursor synchronization between Markdown and Visual modes.
- **🎨 Premium UI/UX**: Built with a sleek, glassmorphic design system supporting both **Vibrant Light** and **Deep Dark** modes.
- **📱 Mobile Optimized**: Responsive toolbar and layout adjustments that provide a native-app feel on smartphones and tablets.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Editor Core**: [Tiptap](https://tiptap.dev/) & [ProseMirror](https://prosemirror.net/)
- **Markdown Handling**: [tiptap-markdown](https://github.com/ueberdosis/tiptap-markdown) & [Marked](https://marked.js.org/)
- **PDF Generation**: [Puppeteer](https://pptr.dev/) & [@sparticuz/chromium](https://github.com/Sparticuz/chromium)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Rendering**: [KaTeX](https://katex.org/) (Math) & [Mermaid](https://mermaid.js.org/) (Diagrams)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YateendraSahu/mdtopdf.git
   cd mdtopdf
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

- `src/app/page.tsx`: Main editor container and layout logic.
- `src/components/WysiwygEditor.tsx`: Advanced Tiptap implementation with custom NodeViews.
- `src/app/api/generate/route.ts`: Server-side PDF generation pipeline.
- `src/lib/markdown.ts`: Shared markdown parsing and preprocessing logic.
- `src/styles/editor.css`: Custom Prosemirror and utility styles.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Antigravity](https://antigravity.google) and the MDtoPDF Team.
