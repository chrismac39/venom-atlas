import type { EvidenceAssessment } from '@venom-atlas/domain';

const labelByType: Record<EvidenceAssessment['evidenceType'], string> = {
  experimental: 'Experimentally established',
  observational: 'Observational',
  clinical: 'Clinically observed',
  review: 'Review-derived',
  database: 'Database-supported',
  editorial_normalization: 'Editorially normalized',
};

export const EvidenceBadge = ({ evidence }: { evidence: EvidenceAssessment }) => {
  return (
    <span className={`badge evidence-${evidence.confidence}`} title={evidence.notes ?? 'No notes'}>
      {labelByType[evidence.evidenceType]} ({evidence.confidence})
    </span>
  );
};
