/** Formato de dado aceito pelo catálogo (XdY, XdY+Z) — `—` é tratado fora. */
export function isValidDice(expr: string): boolean {
  return /^(\d+)d(\d+)\s*([+-]\s*\d+)?$/i.test(expr.trim());
}
