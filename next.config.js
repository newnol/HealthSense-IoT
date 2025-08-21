// next.config.js
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8001/api/:path*'
      }
    ]
  }
}

export default nextConfig
