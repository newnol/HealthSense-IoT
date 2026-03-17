// pages/_app.js
import { AuthProvider } from '../contexts/AuthContext'
import { AdminProvider } from '../contexts/AdminContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import ErrorBoundary from '../components/ErrorBoundary'
import Head from "next/head";
import OEIKCE0 from '../public/OEIKCE0.png'
import '../styles/animations.css'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AdminProvider>
            <Head>
              <title>Dashboard Sức khỏe</title>
              <link rel="icon" href={OEIKCE0.src} type="image/png" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <meta name="description" content="Hệ thống giám sát sức khỏe thông minh với IoT và AI" />
              <meta name="color-scheme" content="light dark" />
            </Head>
            <ErrorBoundary component="PageComponent">
              <Component {...pageProps} />
            </ErrorBoundary>
          </AdminProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
