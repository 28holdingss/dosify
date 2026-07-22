import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta
          name="description"
          content="Dosify — your daily medication companion. Health Cabinet, schedules, and interaction checks on iOS, Android, and web."
        />
        <title>Dosify — Know your body. Make safer choices.</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Syne:wght@600;700&display=swap"
          rel="stylesheet"
        />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        <style dangerouslySetInnerHTML={{ __html: landingLayoutCss }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #0B0E14;
  margin: 0;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0B0E14;
  }
}
`;

/**
 * Critical: SSR often bakes width:0 / negative px from useWindowDimensions.
 * !important here overrides those broken inline styles on first paint + static export.
 */
const landingLayoutCss = `
#dosify-hero-frame {
  width: min(420px, calc(100vw - 32px)) !important;
  max-width: 100% !important;
  height: auto !important;
  aspect-ratio: 736 / 1104 !important;
  margin-left: auto !important;
  margin-right: auto !important;
  border-radius: 32px !important;
  overflow: hidden !important;
  position: relative !important;
}
#dosify-hero-frame img {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center center !important;
}
#dosify-feature-grid {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 16px !important;
  width: 100% !important;
  max-width: 1100px !important;
}
#dosify-feature-grid > * {
  width: 100% !important;
  max-width: 100% !important;
}
@media (max-width: 900px) {
  #dosify-feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
@media (max-width: 560px) {
  #dosify-feature-grid {
    grid-template-columns: 1fr !important;
  }
  #dosify-hero-frame {
    border-radius: 24px !important;
  }
}
`;
