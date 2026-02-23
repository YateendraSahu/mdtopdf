/** @type {import('next').NextConfig} */
const nextConfig = {
    /* config options here */
    output: 'standalone',
    serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    transpilePackages: ['marked', 'marked-gfm-heading-id', 'marked-mangle'],
    experimental: {
        // Attempting to optimize for Vercel size limit
    },
};

export default nextConfig;
