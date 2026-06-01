// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Rajdhani:wght@400;500;600;700&family=Exo+2:ital,wght@0,300;0,400;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#f97316" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
