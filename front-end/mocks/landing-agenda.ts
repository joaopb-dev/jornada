import type { Agenda } from "@/features/public-agenda/schemas/agenda";

/**
 * Semente da agenda na demo completa (modo `enabled`) — espelha o
 * contrato de `GET /api/agenda/` (ADR-023): equipes com brasão e
 * incursões com data única.
 */
export const agendaSeed: Agenda = {
  groups: [
    {
      id: 1,
      name: "Lâmina de Prata",
      crest_shape: "classico",
      crest_color: "verde",
      crest_symbol: "espada",
      members: [
        { id: 1, name: "Ana Souza", registration: "558001" },
        { id: 2, name: "Bruno Lima", registration: "558002" },
        { id: 3, name: "Carla Mendes", registration: "558003" },
      ],
    },
    {
      id: 2,
      name: "Corvos do Norte",
      crest_shape: "arredondado",
      crest_color: "dourado",
      crest_symbol: "corvo",
      members: [
        { id: 4, name: "Diego Rocha", registration: "558004" },
        { id: 5, name: "Elisa Prado", registration: "558005" },
        { id: 6, name: "Felipe Nunes", registration: "558006" },
      ],
    },
    {
      id: 3,
      name: "Guardiões do Vale",
      crest_shape: "classico",
      crest_color: "vermelho",
      crest_symbol: "arvore",
      members: [
        { id: 7, name: "Gabriela Torres", registration: "558007" },
        { id: 8, name: "Henrique Alves", registration: "558008" },
        { id: 9, name: "Isabela Costa", registration: "558009" },
      ],
    },
    {
      id: 4,
      name: "Chama Errante",
      crest_shape: "arredondado",
      crest_color: "roxo",
      crest_symbol: "chama",
      members: [
        { id: 10, name: "João Batista", registration: "558010" },
        { id: 11, name: "Larissa Pinto", registration: "558011" },
        { id: 12, name: "Mateus Ferreira", registration: "558012" },
      ],
    },
  ],
  incursions: [
    {
      id: 1,
      number: 1,
      title: "O Despertar dos Paradigmas",
      date: "2026-09-14",
      participations: [
        { group_id: 1, language: "C" },
        { group_id: 2, language: "Pascal" },
        { group_id: 3, language: "Fortran" },
      ],
    },
    {
      id: 2,
      number: 2,
      title: "A Travessia Funcional",
      date: "2026-10-26",
      participations: [
        { group_id: 2, language: "Haskell" },
        { group_id: 3, language: "Elixir" },
        { group_id: 4, language: "Lisp" },
      ],
    },
    {
      id: 3,
      number: 3,
      title: "O Enigma Lógico",
      date: "2026-11-16",
      participations: [
        { group_id: 1, language: "Prolog" },
        { group_id: 3, language: "Datalog" },
        { group_id: 4, language: "Mercury" },
      ],
    },
  ],
};
