import { z } from "zod";

/**
 * DTO de `/api/students/` — espelha o `StudentSerializer` do back-end
 * (ADR-024): `matricula` é a regra de 6 dígitos validada **no servidor**.
 */
export const studentSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1).max(100),
  matricula: z.string(),
  group: z.number().int().nullable(),
  group_name: z.string().nullable(),
  is_active: z.boolean(),
});

export type Student = z.infer<typeof studentSchema>;

/** O que o form edita: nome + matrícula. */
export interface StudentWrite {
  name: string;
  matricula: string;
}
