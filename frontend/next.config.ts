import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // バックエンドAPIへのリクエストをリダイレクト
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_API_URL || "http://localhost:8000/api"}/:path*`,
      },
    ]
  },

  // 必要に応じて他の設定を追加
  reactStrictMode: true,
}

export default nextConfig

