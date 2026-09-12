import React from 'react';

export interface ActivityChartDatum {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  title: string;
  subtitle: string;
  data: ActivityChartDatum[];
  valueLabel?: string;
  formatValue?: (value: number) => string;
}

const DEFAULT_COLORS = ['#15ed48', '#00a699', '#38bdf8', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ActivityBarChart({
  title,
  subtitle,
  data,
  valueLabel,
  formatValue = (value) => value.toLocaleString()
}: ChartProps) {
  const safeData = data.map((item) => ({ ...item, value: Math.max(0, Number(item.value) || 0) }));
  const maxValue = Math.max(1, ...safeData.map((item) => item.value));
  const total = safeData.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-2xl border border-black/15 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-black">{title}</h3>
          <p className="mt-1 text-[11px] text-black/60">{subtitle}</p>
        </div>
        {valueLabel && (
          <div className="text-right">
            <div className="font-mono text-lg font-black text-black">{formatValue(total)}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-black/50">{valueLabel}</div>
          </div>
        )}
      </div>

      <div className="mt-5 flex h-44 items-end gap-2 border-b border-l border-black/15 px-2 pb-0 pt-5" role="img" aria-label={`${title}: ${safeData.map((item) => `${item.label} ${formatValue(item.value)}`).join(', ')}`}>
        {safeData.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center text-xs text-black/45">No activity recorded yet</div>
        ) : safeData.map((item, index) => {
          const height = item.value === 0 ? 3 : Math.max(10, (item.value / maxValue) * 100);
          return (
            <div key={`${item.label}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <div className="mb-1 font-mono text-[10px] font-bold text-black">{formatValue(item.value)}</div>
              <div
                className="w-full max-w-14 rounded-t-md border border-black/10 transition-all duration-500 group-hover:opacity-80"
                style={{ height: `${height}%`, backgroundColor: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                title={`${item.label}: ${formatValue(item.value)}`}
              />
              <div className="h-8 w-full truncate pt-2 text-center text-[9px] font-semibold text-black/60" title={item.label}>{item.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ActivityDonutChart({
  title,
  subtitle,
  data,
  valueLabel = 'total',
  formatValue = (value) => value.toLocaleString()
}: ChartProps) {
  const safeData = data
    .map((item, index) => ({
      ...item,
      value: Math.max(0, Number(item.value) || 0),
      color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
    }))
    .filter((item) => item.value > 0);
  const total = safeData.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments = safeData.map((item) => {
    const start = cursor;
    cursor += (item.value / total) * 100;
    return `${item.color} ${start}% ${cursor}%`;
  });
  const donutBackground = total > 0
    ? `conic-gradient(${segments.join(', ')})`
    : 'conic-gradient(#e5e7eb 0% 100%)';

  return (
    <section className="rounded-2xl border border-black/15 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-bold text-black">{title}</h3>
        <p className="mt-1 text-[11px] text-black/60">{subtitle}</p>
      </div>

      <div className="mt-5 grid grid-cols-[150px_1fr] items-center gap-5">
        <div
          className="relative mx-auto h-36 w-36 rounded-full border border-black/10"
          style={{ background: donutBackground }}
          role="img"
          aria-label={`${title}: ${safeData.map((item) => `${item.label} ${formatValue(item.value)}`).join(', ') || 'no data'}`}
        >
          <div className="absolute inset-[24px] flex flex-col items-center justify-center rounded-full border border-black/10 bg-white text-center">
            <div className="font-mono text-xl font-black text-black">{formatValue(total)}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-black/50">{valueLabel}</div>
          </div>
        </div>

        <div className="space-y-2.5">
          {safeData.length === 0 ? (
            <div className="text-xs text-black/45">No activity recorded yet</div>
          ) : safeData.map((item) => {
            const percentage = total ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-2 text-black/65">
                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="whitespace-nowrap font-mono font-bold text-black">{formatValue(item.value)} <span className="text-[9px] text-black/45">{percentage}%</span></span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
