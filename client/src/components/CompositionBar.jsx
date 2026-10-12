/**
 * Horizontal stacked bar: durable vs consumable within one laboratory.
 *
 * Two things are encoded at once, deliberately —
 *   • bar LENGTH is the lab's total measured against the largest lab (`max`),
 *     so rows are comparable down the column;
 *   • the SPLIT inside it is the part-to-whole composition.
 *
 * Colours are the two validated categorical slots (indigo / cyan, CVD ΔE 16.4).
 * Segments are separated by a 2px surface gap rather than a stroke, the data
 * end is rounded 4px while the baseline edge stays square, and every value is
 * also printed as a number in the adjacent table cells — so identity never
 * rests on colour alone.
 */
export default function CompositionBar({ durable = 0, consumable = 0, max = 0, height = 10 }) {
  const total = durable + consumable;
  const scale = max > 0 ? total / max : 0;

  if (!total) {
    return (
      <div className="comp-track" style={{ height }}>
        <span className="visually-hidden">No items</span>
      </div>
    );
  }

  return (
    <div className="comp-track" style={{ height }} title={`${durable} durable · ${consumable} consumable`}>
      <div className="comp-bar" style={{ width: `${Math.max(scale * 100, 2)}%` }}>
        {durable > 0 && (
          <span
            className="comp-seg"
            style={{ flexGrow: durable, background: 'var(--series-durable)' }}
            aria-hidden="true"
          />
        )}
        {consumable > 0 && (
          <span
            className="comp-seg"
            style={{ flexGrow: consumable, background: 'var(--series-consumable)' }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

/** Legend for the pair above. Always rendered wherever the bar is — two series. */
export function CompositionLegend() {
  return (
    <div className="viz-legend">
      <span className="legend-item">
        <span className="legend-swatch" style={{ background: 'var(--series-durable)' }} />
        Durable
      </span>
      <span className="legend-item">
        <span className="legend-swatch" style={{ background: 'var(--series-consumable)' }} />
        Consumable
      </span>
    </div>
  );
}
