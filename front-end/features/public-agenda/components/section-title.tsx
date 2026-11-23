import type { ComponentType } from "react";

/** Cabeçalho de seção do painel de areia: ícone + título + apoio. */
export function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-5 border-b border-sand-line/70 pb-3">
      <h2 className="flex items-center gap-2 font-display text-2xl text-sand-ink">
        <Icon className="h-5 w-5 text-sand-deep" aria-hidden />
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1 font-reading text-sm text-sand-ink-soft">{subtitle}</p>
      )}
    </div>
  );
}
