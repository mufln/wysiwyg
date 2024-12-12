const nextConfig = {
    rewrites: async() => [
        {
            source: "/api/:path*",
            destination: "http://localhost:8000/:path*"
        }
    ],
    output: 'standalone',
};

export default nextConfig;
