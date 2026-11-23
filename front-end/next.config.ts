import type { NextConfig } from "next";

// Origem interna do Django. O browser nunca fala com ela diretamente: o
// `rewrites` abaixo publica /api no mesmo origem do Next e encaminha em
// loopback. Em produção, aponte API_PROXY_ORIGIN para o serviço interno
// (ex.: http://django:8000) — mantenha-o fora do alcance público.
const API_PROXY_ORIGIN = process.env.API_PROXY_ORIGIN || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
  // Django exige barra final nas URLs (APPEND_SLASH não redireciona POST).
  // Sem este flag o Next devolve 308 tirando a barra antes do proxy.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        // Casos sem subcaminho (evita `/api//` no destino).
        source: "/api",
        destination: `${API_PROXY_ORIGIN}/api/`,
      },
      {
        source: "/api/",
        destination: `${API_PROXY_ORIGIN}/api/`,
      },
      {
        // Segurança: elimina o canal http browser→API. As requisições passam
        // a ser same-origin (https://localhost:3000/api/...) e o proxy do
        // Next as repassa ao Django via loopback http (interno).
        //
        // A barra final é FORÇADA no destino: o matcher do Next normaliza a
        // URL e o `:path*` chega sempre sem barra — e o Django exige barra
        // final (APPEND_SLASH não redireciona POST). Como a captura nunca
        // traz barra, não há risco de `//`.
        source: "/api/:path*",
        destination: `${API_PROXY_ORIGIN}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
