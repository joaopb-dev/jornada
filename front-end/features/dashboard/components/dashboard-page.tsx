"use client";


import { PageHeader, PageState, Scroll, Seal } from "@/features/journey/components/ui";
import { getStudents } from "@/features/students/services/student-service";
import { getGroups } from "@/features/groups/services/group-service";
import { getJourneys } from "@/features/missions/services/journey-service";
import { getGroupJourneys } from "@/features/missions/services/battle-service";
import { getAgenda } from "@/features/public-agenda/services/agenda-service";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDate } from "@/lib/date-format";
import { Link } from "@/lib/router-compat";
import { useJornada } from "@/stores/journey-store";
import { ArrowRight, BookOpen, Scroll as ScrollIcon, Shield, Skull, Users } from "@/components/icons/rpg-icons";
import type { ReactNode } from "react";
import { Crest } from "@/features/journey/components/crest";



function Stat({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Scroll>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-4xl font-semibold">{value}</p>
        </div>
        <div className="text-accent-foreground">{icon}</div>
      </div>
    </Scroll>
  );
}

function Salao() {
  const { session } = useJornada();
  const studentsQuery = useApiQuery(getStudents);
  const groupsQuery = useApiQuery(getGroups);
  const journeysQuery = useApiQuery(getJourneys);
  const runsQuery = useApiQuery((signal) => getGroupJourneys(undefined, signal));
  const agendaQuery = useApiQuery(getAgenda);
  const queries = [studentsQuery, groupsQuery, journeysQuery, runsQuery, agendaQuery];
  const status = queries.some((q) => q.status === "error")
    ? "error"
    : queries.some((q) => q.status === "loading")
      ? "loading"
      : "ready";
  const retry = () => queries.forEach((q) => q.retry());

  const runs = runsQuery.data ?? [];
  const count = (k: "PROG" | "DONE" | "FAIL") => runs.filter((r) => r.status === k).length;
  const agenda = agendaQuery.data;
  const groupName = (id: number) => agenda?.groups.find((g) => g.id === id)?.name ?? "";
  // Próximas incursões: com data primeiro, em ordem crescente.
  const upcoming = [...(agenda?.incursions ?? [])]
    .sort((a, b) => (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31"))
    .slice(0, 5);
  const shortcuts = [
    { to: "/aventureiros", label: "Aventureiros", icon: Users },
    { to: "/grupos", label: "Grupos", icon: Shield },
    { to: "/habilidades", label: "Habilidades", icon: BookOpen },
    { to: "/chefes", label: "Chefes", icon: Skull },
    { to: "/perguntas", label: "Perguntas", icon: ScrollIcon },
  ] as const;

  return (
    <PageState status={status} retry={retry}>
      <PageHeader title="Salão da Guilda" description={`Bem-vinda de volta, ${session?.name}. Aqui está o estado das jornadas.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Aventureiros" value={studentsQuery.data?.length ?? 0} icon={<Users className="h-5 w-5" strokeWidth={1.5} />} />
        <Stat label="Grupos" value={groupsQuery.data?.length ?? 0} icon={<Shield className="h-5 w-5" strokeWidth={1.5} />} />
        <Stat label="Missões" value={journeysQuery.data?.length ?? 0} icon={<Crest className="h-5 w-5" />} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {(["PROG", "DONE", "FAIL"] as const).map((k) => (
          <Scroll key={k} className="flex items-center justify-between py-4">
            <Seal kind={k} />
            <span className="font-display text-2xl font-semibold">{count(k)}</span>
          </Scroll>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl">Próximas missões</h2>
            <Link to="/agenda-incursoes" className="text-sm text-muted-foreground hover:text-foreground">Ver agenda</Link>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 && <p className="font-reading text-muted-foreground">Nenhuma missão agendada.</p>}
            {upcoming.map((inc) => (
              <Link key={inc.id} to="/agenda-incursoes" className="block">
                <Scroll hover className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Incursão {inc.number} · {inc.date ? formatDate(inc.date) : "sem data"}</p>
                    <p className="font-display text-base font-semibold">{inc.title}</p>
                    <p className="font-reading text-sm text-muted-foreground">
                      {inc.participations.map((p) => groupName(p.group_id)).filter(Boolean).join(", ") || "Nenhuma equipe inscrita"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Scroll>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 text-xl">Atalhos</h2>
          <div className="grid gap-2">
            {shortcuts.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex h-11 items-center gap-3 rounded-md border border-border bg-card px-4 text-sm transition-colors hover:border-primary-hover hover:bg-accent">
                <Icon className="h-4 w-4 text-accent-foreground" strokeWidth={1.6} /> {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageState>
  );
}

export { Salao as DashboardPage };
