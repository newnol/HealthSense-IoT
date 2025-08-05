import Link from "next/link";


export default function Header() {
  return (
    <header style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      borderBottom: '1px solid #ccc' 
    }}>
      <nav>
        <ul style={{ 
          listStyle: 'none', 
          display: 'flex', 
          gap: '20px', 
          margin: 0, 
          padding: 0 
        }}>
          <li>
            <Link href="/" style={{ textDecoration: 'none', color: '#333' }}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/about" style={{ textDecoration: 'none', color: '#333' }}>
              About
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}