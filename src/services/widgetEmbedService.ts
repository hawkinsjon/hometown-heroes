export const generateWidgetEmbedCode = (containerElementId: string = 'veterans-banner-widget'): string => {
  return `
<div id="${containerElementId}"></div>
<script src="https://bheights.com/veterans-banner-widget/embed.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    VeteransBannerWidget.initialize('${containerElementId}');
  });
</script>
  `.trim();
};

export const getEmbedInstructions = (): string => {
  return `
# Veterans Banner Program Widget - Embedding Instructions

To add the Veterans Banner Program submission form to your website, follow these steps:

1. Copy the following HTML code:

\`\`\`html
${generateWidgetEmbedCode()}
\`\`\`

2. Paste this code into your website's HTML where you want the widget to appear.

3. The widget will automatically resize to fit its container.

4. For technical support, contact the Berkeley Heights Veterans Committee.
  `.trim();
};