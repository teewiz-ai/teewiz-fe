/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,

    // 🆕  Allow <Image> to load from your bucket
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ai-teelab-designs.s3.eu-central-1.amazonaws.com',
        port: '',                // leave empty for default 443
        pathname: '/generated/**' // allow any key under /generated/
      },
      // add extra patterns here (e.g., CloudFront URL) if you later switch
    ],
  },
  webpack(config, { isServer }) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
    }

    return config
  }
}

export default nextConfig
