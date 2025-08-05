import Link from "next/link";
import Header from "./components/Header";

export default function HomePage() {
  return (
    <div>
      <Header />
      <main style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Physics Final Project</h1>
        <h2>Heart Rate & SpO2 Monitoring System</h2>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          Welcome to our comprehensive health monitoring system
        </p>
        <Link 
          href="/about"
          style={{ 
            backgroundColor: '#0070f3', 
            color: 'white', 
            padding: '12px 24px', 
            textDecoration: 'none', 
            borderRadius: '5px',
            fontSize: '16px'
          }}
        >
          Learn More About This Project
        </Link>
      </main>
    </div>
  );
}