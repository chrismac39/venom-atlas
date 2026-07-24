import { useId } from 'react';

interface DeliveryMechanismDiagramProps {
  title: string;
  ariaLabel: string;
  steps: [string, string, string, string];
  note?: string;
}

interface StepLabelProps {
  x: number;
  y: number;
  label: string;
  maxCharsPerLine: number;
  maxLines?: number;
}

const wrapStepLabel = (label: string, maxCharsPerLine: number, maxLines: number): string[] => {
  const words = label
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return [''];
  }

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      if (lines.length === maxLines - 1) {
        const truncatedWord = word.length > maxCharsPerLine ? `${word.slice(0, maxCharsPerLine - 1)}...` : word;
        lines.push(truncatedWord);
        return lines;
      }
      current = word;
      continue;
    }

    lines.push(`${word.slice(0, Math.max(maxCharsPerLine - 1, 1))}...`);
    return lines;
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines - 1);
    const tail = lines[maxLines - 1] ?? '';
    return visible.concat(`${tail.slice(0, maxCharsPerLine - 1)}...`);
  }

  return lines;
};

const StepLabel = ({ x, y, label, maxCharsPerLine, maxLines = 3 }: StepLabelProps) => {
  const lines = wrapStepLabel(label, maxCharsPerLine, maxLines);
  const lineHeight = 13;
  const startOffset = -((lines.length - 1) * lineHeight) / 2;

  return (
    <text x={x} y={y} fill="#f2eee6" textAnchor="middle" fontSize="11.5" dominantBaseline="middle">
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? startOffset : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

export const DeliveryMechanismDiagram = ({
  title,
  ariaLabel,
  steps,
  note = 'Illustration is schematic and not photorealistic anatomy.',
}: DeliveryMechanismDiagramProps) => {
  const markerId = `arrow-${useId().replace(/:/g, '')}`;

  return (
    <section className="panel" aria-label={ariaLabel}>
      <h3>{title}</h3>
      <svg viewBox="0 0 700 140" role="img" aria-label={ariaLabel}>
        <defs>
          <marker id={markerId} markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 z" fill="#c58f3a" />
          </marker>
        </defs>
        <rect x="20" y="30" width="150" height="80" fill="#262a29" stroke="#3b3f3d" />
        <rect x="200" y="30" width="150" height="80" fill="#262a29" stroke="#3b3f3d" />
        <rect x="380" y="30" width="150" height="80" fill="#262a29" stroke="#3b3f3d" />
        <rect x="560" y="30" width="120" height="80" fill="#262a29" stroke="#3b3f3d" />
        <StepLabel x={95} y={70} label={steps[0]} maxCharsPerLine={18} />
        <StepLabel x={275} y={70} label={steps[1]} maxCharsPerLine={18} />
        <StepLabel x={455} y={70} label={steps[2]} maxCharsPerLine={18} />
        <StepLabel x={620} y={70} label={steps[3]} maxCharsPerLine={14} />
        <line
          x1="170"
          y1="70"
          x2="198"
          y2="70"
          stroke="#c58f3a"
          strokeWidth="2"
          markerEnd={`url(#${markerId})`}
        />
        <line
          x1="350"
          y1="70"
          x2="378"
          y2="70"
          stroke="#c58f3a"
          strokeWidth="2"
          markerEnd={`url(#${markerId})`}
        />
        <line
          x1="530"
          y1="70"
          x2="558"
          y2="70"
          stroke="#c58f3a"
          strokeWidth="2"
          markerEnd={`url(#${markerId})`}
        />
      </svg>
      <p className="muted">{note}</p>
    </section>
  );
};
