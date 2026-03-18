/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    // Set basePath ONLY if your repo is NOT the root GitHub Pages site.
    // Example: if URL is username.github.io/mdtopdf, uncomment and set:
    basePath: '/mdtopdf',
    assetPrefix: '/mdtopdf/',
    images: {
        unoptimized: true,
    },
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
};

export default nextConfig;
