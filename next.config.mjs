/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
   images: {
    remotePatterns: [
      {
        protocol: 'https',
        //hostname: 'res.cloudinary.com',
        hostname: '**', // This allows ALL https domains
      },
    ],
  },
};

export default nextConfig;
