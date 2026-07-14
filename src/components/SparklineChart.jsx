/**
 * SparklineChart — lightweight SVG sparkline, no external chart library needed.
 * Props:
 *   data:    [{ date: 'YYYY-MM-DD', count: number }]
 *   color:   Tailwind color token string for stroke, e.g. 'brand' | 'blue'
 *   label:   string — shown above chart
 *   total:   number — shown as big number
 */
export default function SparklineChart({ data = [], color = 'brand', label = '', total }) {
  if (!data || data.length === 0) return null;

  const W = 300;
  const H = 56;
  const PAD = 4;

  const counts = data.map((d) => d.count);
  const max = Math.max(...counts, 1);

  // Build SVG polyline points
  const points = counts.map((c, i) => {
    const x = PAD + (i / (counts.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((c / max) * (H - PAD * 2));
    return `${x},${y}`;
  }).join(' ');

  // Build filled area path
  const firstX = PAD;
  const lastX = PAD + (W - PAD * 2);
  const areaPath = `M${firstX},${H - PAD} ` +
    counts.map((c, i) => {
      const x = PAD + (i / (counts.length - 1)) * (W - PAD * 2);
      const y = H - PAD - ((c / max) * (H - PAD * 2));
      return `L${x},${y}`;
    }).join(' ') +
    ` L${lastX},${H - PAD} Z`;

  // Color map
  const colorMap = {
    brand: { stroke: '#7c3aed', fill: 'rgba(124,58,237,0.08)' },
    blue:  { stroke: '#2563eb', fill: 'rgba(37,99,235,0.08)' },
    green: { stroke: '#16a34a', fill: 'rgba(22,163,74,0.08)' },
  };
  const { stroke, fill } = colorMap[color] || colorMap.brand;

  // X-axis labels: show first, middle, last dates
  const first = data[0]?.date ? new Date(data[0].date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '';
  const last  = data[data.length - 1]?.date ? new Date(data[data.length - 1].date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }) : '';

  const hasActivity = counts.some((c) => c > 0);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{total ?? counts.reduce((a, b) => a + b, 0)}</p>
      </div>

      {hasActivity ? (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 56 }}>
          <path d={areaPath} fill={fill} />
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <div className="h-14 flex items-center justify-center">
          <p className="text-xs text-gray-300 dark:text-gray-600">No activity in last 30 days</p>
        </div>
      )}

      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{first}</span>
        <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
        <span className="text-xs text-gray-400">{last}</span>
      </div>
    </div>
  );
}
