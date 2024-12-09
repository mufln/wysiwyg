const nextConfig = {
  /* config options here */
    rewrites: async () => {
        return [
            {
                source: '/api/:path*',
                destination: `http://backend:8000/:path*`
            }
        ]
    },
    output: 'standalone',
};

export default nextConfig;
