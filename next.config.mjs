/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    transpilePackages: [
        'marked', 
        'marked-gfm-heading-id', 
        'marked-mangle',
        '@tiptap/core',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/extension-placeholder',
        '@tiptap/extension-code-block-lowlight',
        '@tiptap/extension-link',
        '@tiptap/extension-image',
        'tiptap-markdown'
    ],
    experimental: {
        // Attempting to optimize for Vercel size limit
    },
};

export default nextConfig;
