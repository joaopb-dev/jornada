// Gera, se ainda não existir, o par de certificados self-signed usado pelo
// `next dev --experimental-https` (ver package.json). Sem eles o Next não
// serve HTTPS e o site ficaria em texto claro.
//
// - Certificados ficam em front-end/certificates/ (gitignored — NUNCA
//   commite a chave).
// - O navegador avisa que o certificado não é de uma autoridade confiável;
//   aceite o aviso em desenvolvimento (ou use mkcert para confiar nele).
//
// Executado automaticamente pelo npm antes de `npm run dev` (script predev).
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "certificates");
const keyPath = path.join(dir, "localhost-key.pem");
const certPath = path.join(dir, "localhost.pem");

if (existsSync(keyPath) && existsSync(certPath)) {
  process.exit(0); // já gerados
}

mkdirSync(dir, { recursive: true });
console.log("→ gerando certificado self-signed de desenvolvimento (openssl)…");
execFileSync(
  "openssl",
  [
    "req", "-x509", "-newkey", "rsa:2048", "-nodes",
    "-keyout", keyPath,
    "-out", certPath,
    "-days", "825",
    "-subj", "/CN=localhost",
    "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1",
  ],
  { stdio: ["ignore", "ignore", "inherit"] },
);
chmodSync(keyPath, 0o600);
console.log(`✔ ${path.relative(process.cwd(), keyPath)} · ${path.relative(process.cwd(), certPath)}`);
