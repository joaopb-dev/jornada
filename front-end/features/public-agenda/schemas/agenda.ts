import { z } from "zod";

/** Aventureiro embutido na agenda (matrícula de 6 dígitos vem do backend). */
export const agendaMemberSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  registration: z.string().min(1),
});

/** Equipe ativa com o brasão (ADR-016) — o backend só devolve ativas. */
export const agendaGroupSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1),
  crest_shape: z.string().min(1),
  crest_color: z.string().min(1),
  crest_symbol: z.string().min(1),
  members: z.array(agendaMemberSchema),
});

/** Presença da equipe na incursão: a linguagem apresentada. */
export const agendaParticipationSchema = z.object({
  group_id: z.number(),
  language: z.string().trim().min(1).max(100),
});

/**
 * Incursão com **data única** (ADR-023). `id` acompanha a leitura; o `PUT`
 * pode enviá-lo ou não (o backend substitui a agenda e devolve ids novos).
 */
export const agendaIncursionSchema = z.object({
  id: z.number(),
  number: z.number().int().min(1),
  title: z.string().min(1),
  date: z.iso.date().nullable(),
  participations: z.array(agendaParticipationSchema),
});

/** Corpo do `PUT /api/agenda/`: só as incursões (grupos saem do backend). */
export const agendaIncursionInputSchema = z.object({
  id: z.number().optional(),
  number: z.number().int().min(1),
  title: z.string().max(100),
  date: z.iso.date().nullable(),
  participations: z.array(agendaParticipationSchema),
});

export const agendaWriteSchema = z.object({
  incursions: z.array(agendaIncursionInputSchema),
});

/** `GET/PUT /api/agenda/` — grupos ativos + incursões (contrato real). */
export const agendaSchema = z
  .object({
    groups: z.array(agendaGroupSchema),
    incursions: z.array(agendaIncursionSchema),
  })
  .refine(
    (agenda) => new Set(agenda.groups.map((group) => group.id)).size === agenda.groups.length,
    "Equipe repetida na agenda.",
  )
  .refine(
    (agenda) => new Set(agenda.incursions.map((inc) => inc.number)).size === agenda.incursions.length,
    "Número de incursão repetido.",
  );

export type AgendaMember = z.infer<typeof agendaMemberSchema>;
export type AgendaGroup = z.infer<typeof agendaGroupSchema>;
export type AgendaParticipation = z.infer<typeof agendaParticipationSchema>;
export type AgendaIncursion = z.infer<typeof agendaIncursionSchema>;
export type AgendaIncursionInput = z.infer<typeof agendaIncursionInputSchema>;
export type AgendaWrite = z.infer<typeof agendaWriteSchema>;
export type Agenda = z.infer<typeof agendaSchema>;
