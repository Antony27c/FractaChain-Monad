import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build autocontenido (.next/standalone) para la imagen Docker de producción.
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  webpack: (config) => {
    // Privy y los conectores de wagmi importan paquetes opcionales
    // (x402, React Native, Farcaster) que no usamos en la web.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core": false,
      "@x402/evm": false,
      "@x402/extensions": false,
      "@x402/svm": false,
      "@react-native-async-storage/async-storage": false,
      "@farcaster/mini-app-solana": false,
    };
    return config;
  },
};

export default nextConfig;
