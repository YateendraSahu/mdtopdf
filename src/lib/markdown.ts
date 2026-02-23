export async function parseMarkdown(markdown: string): Promise<string> {
    // Dynamic imports to bypass Turbopack's static analysis issues with these UMD/ESM dual packages
    const { Marked } = await import('marked');
    const { gfmHeadingId } = await import('marked-gfm-heading-id');

    const markedInstance = new Marked();
    markedInstance.use(gfmHeadingId());

    const options = {
        gfm: true,
        breaks: true,
    };

    return markedInstance.parse(markdown, options);
}
