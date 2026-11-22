/** Regra da matrícula: exatamente 6 dígitos (a mesma do back-end). */
export const REGISTRATION_PATTERN = /^\d{6}$/;

/**
 * Validação de formato **no form** (feedback imediato). A unicidade é
 * regra do servidor (`Já existe um aluno com esta matrícula.`) e chega
 * como erro de campo no submit.
 */
export function validateRegistration(registration: string): string | undefined {
  const value = registration.trim();
  if (!value) return "Informe a matrícula.";
  if (!REGISTRATION_PATTERN.test(value)) return "A matrícula deve ter exatamente 6 dígitos.";
  return undefined;
}
