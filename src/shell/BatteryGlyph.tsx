import React, { useId } from 'react';

interface BatteryGlyphProps {
  level: number;
  charging: boolean;
  size?: number;
  className?: string;
}

const BODY = { x: 1, y: 0.75, width: 19.9, height: 10.5, rx: 2.5 };
const NUB = { x: 21.25, y: 4.05, width: 1.75, height: 3.9, rx: 0.8 };
const INNER = { x: 1.72, y: 1.47, width: 18.46, height: 9.06, rx: 1.9 };
const STROKE_WIDTH = 1.15;

const BOLT_PATH =
  'M11.6 2.25L8.4 6.7h2.3l-0.5 3.15L13.5 5.4h-2.3L11.6 2.25z';

export const BatteryGlyph: React.FC<BatteryGlyphProps> = ({
  level,
  charging,
  size = 11,
  className = '',
}) => {
  const maskId = `battery-cut-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`;
  const clamped = Math.min(1, Math.max(0, level));
  const low = clamped <= 0.2 && !charging;
  const flash = charging && clamped <= 0.2;
  const fillWidth = INNER.width * clamped;

  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 24 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={[
        flash ? 'animate-battery-flash' : '',
        low ? 'text-[#ff3b30] dark:text-[#ff453a]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="12">
          <rect
            x={INNER.x}
            y={INNER.y}
            width={INNER.width}
            height={INNER.height}
            rx={INNER.rx}
            fill="#fff"
          />
          {charging && <path d={BOLT_PATH} fill="#000" />}
        </mask>
      </defs>

      <rect
        x={BODY.x}
        y={BODY.y}
        width={BODY.width}
        height={BODY.height}
        rx={BODY.rx}
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
      />
      <rect
        x={NUB.x}
        y={NUB.y}
        width={NUB.width}
        height={NUB.height}
        rx={NUB.rx}
        fill="currentColor"
      />

      {fillWidth > 0.02 && (
        <rect
          x={INNER.x}
          y={INNER.y}
          width={fillWidth}
          height={INNER.height}
          rx={INNER.rx}
          fill="currentColor"
          mask={`url(#${maskId})`}
          className="battery-fill"
          style={{ width: fillWidth }}
        />
      )}
    </svg>
  );
};
