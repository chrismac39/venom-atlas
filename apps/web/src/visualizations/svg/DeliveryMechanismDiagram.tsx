export const DeliveryMechanismDiagram = () => {
  return (
    <section className="panel" aria-label="Schematic sting delivery sequence">
      <h3>Sting delivery sequence (schematic)</h3>
      <svg
        viewBox="0 0 700 140"
        role="img"
        aria-label="Mandibles grip then abdomen rotates then stinger penetrates and venom is injected"
      >
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 z" fill="#c58f3a" />
          </marker>
        </defs>
        <rect x="20" y="30" width="150" height="80" fill="#262a29" stroke="#3b3f3d" />
        <rect x="200" y="30" width="150" height="80" fill="#262a29" stroke="#3b3f3d" />
        <rect x="380" y="30" width="150" height="80" fill="#262a29" stroke="#3b3f3d" />
        <rect x="560" y="30" width="120" height="80" fill="#262a29" stroke="#3b3f3d" />
        <text x="95" y="70" fill="#f2eee6" textAnchor="middle">
          Mandibles grip
        </text>
        <text x="275" y="70" fill="#f2eee6" textAnchor="middle">
          Abdomen rotates
        </text>
        <text x="455" y="70" fill="#f2eee6" textAnchor="middle">
          Stinger penetrates
        </text>
        <text x="620" y="70" fill="#f2eee6" textAnchor="middle">
          Venom injected
        </text>
        <line
          x1="170"
          y1="70"
          x2="198"
          y2="70"
          stroke="#c58f3a"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        <line
          x1="350"
          y1="70"
          x2="378"
          y2="70"
          stroke="#c58f3a"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        <line
          x1="530"
          y1="70"
          x2="558"
          y2="70"
          stroke="#c58f3a"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
      </svg>
      <p className="muted">Illustration is schematic and not photorealistic anatomy.</p>
    </section>
  );
};
