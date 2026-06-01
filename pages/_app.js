// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a25',
            color: '#e8e8f0',
            border: '1px solid rgba(249,115,22,0.3)',
            fontFamily: 'Exo 2, sans-serif',
          },
          success: {
            iconTheme: { primary: '#f97316', secondary: '#0a0a0f' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' },
          },
        }}
      />
    </>
  );
}
