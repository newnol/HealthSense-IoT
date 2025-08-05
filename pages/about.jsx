import Link from "next/link";
import Header from "./components/Header";

export default function AboutPage() {
  return (
    <div>
      <Header />
      <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>About Physics Final Project</h1>
        
        <section style={{ marginBottom: '30px' }}>
          <h2>Heart Rate & SpO2 Monitoring System</h2>
          <p>
            This is a comprehensive monitoring system designed to track heart rate 
            and blood oxygen saturation (SpO2) levels in real-time. The system 
            combines hardware sensors with modern web technologies to provide 
            accurate health monitoring capabilities.
          </p>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>Features</h2>
          <ul>
            <li>Real-time heart rate monitoring</li>
            <li>SpO2 (blood oxygen saturation) measurement</li>
            <li>Data visualization and analytics</li>
            <li>Firebase integration for data storage</li>
            <li>RESTful API for device communication</li>
            <li>Responsive web interface</li>
          </ul>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>Technology Stack</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>Frontend</h3>
              <ul>
                <li>Next.js</li>
                <li>React</li>
                <li>JavaScript/JSX</li>
              </ul>
            </div>
            <div>
              <h3>Backend</h3>
              <ul>
                <li>FastAPI (Python)</li>
                <li>Firebase Admin SDK</li>
                <li>Vercel deployment</li>
              </ul>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '30px' }}>
          <h2>Project Structure</h2>
          <p>
            The project follows a modern full-stack architecture with separate 
            API endpoints for device communication and a responsive web interface 
            for data visualization and system management.
          </p>
        </section>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link 
            href="/" 
            style={{ 
              backgroundColor: '#0070f3', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '5px' 
            }}
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}