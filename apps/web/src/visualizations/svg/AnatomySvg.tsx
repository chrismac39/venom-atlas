import type { AnatomyHighlight } from '@venom-atlas/visualization-contracts';

const colorByIntensity: Record<AnatomyHighlight['intensity'], string> = {
  primary: '#c58f3a',
  secondary: '#988d56',
  context: '#6b6f7a',
};

const systemShape = (systemId: string): { x: number; y: number; width: number; height: number } => {
  if (systemId === 'anat-skin') return { x: 145, y: 20, width: 110, height: 220 };
  if (systemId === 'anat-peripheral-nerves') return { x: 165, y: 70, width: 70, height: 150 };
  if (systemId === 'anat-circulatory') return { x: 170, y: 85, width: 60, height: 120 };
  if (systemId === 'anat-respiratory') return { x: 170, y: 70, width: 60, height: 55 };
  return { x: 160, y: 130, width: 80, height: 70 };
};

export const AnatomySvg = ({ highlights }: { highlights: AnatomyHighlight[] }) => {
  return (
    <section className="panel" aria-label="Human physiology systems">
      <h3>Human systems map (schematic)</h3>
      <svg
        viewBox="0 0 400 280"
        role="img"
        aria-label="Schematic body systems with highlighted layers"
      >
        <ellipse cx="200" cy="35" rx="18" ry="18" fill="#2d3130" stroke="#3b3f3d" />
        <rect x="150" y="50" width="100" height="190" rx="40" fill="#232726" stroke="#3b3f3d" />
        {highlights.map((highlight) => {
          const shape = systemShape(highlight.systemId);
          return (
            <rect
              key={highlight.systemId}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              fill={colorByIntensity[highlight.intensity]}
              fillOpacity={0.22}
              stroke={colorByIntensity[highlight.intensity]}
            />
          );
        })}
      </svg>
      <ul>
        {highlights.map((highlight) => (
          <li key={highlight.systemId}>
            <strong>{highlight.label}:</strong> {highlight.explanation}
          </li>
        ))}
      </ul>
    </section>
  );
};
