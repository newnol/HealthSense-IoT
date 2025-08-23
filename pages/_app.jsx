// pages/_app.js
import { AuthProvider } from '../contexts/AuthContext'
import { AdminProvider } from '../contexts/AdminContext'
import Head from "next/head";
import OEIKCE0 from '../public/OEIKCE0.png'
import '../styles/animations.css'

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <AdminProvider>
      <Head>
        <title>Dashboard Sức khỏe</title>
        <link rel="icon" href={OEIKCE0.src} type="image/png" />
      </Head>
        <Component {...pageProps} />
      </AdminProvider>
    </AuthProvider>
  )
}
