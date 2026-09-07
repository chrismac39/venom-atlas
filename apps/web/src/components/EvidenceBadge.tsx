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
  const review = evidence.reviewedAt ? `Reviewed ${evidence.reviewedAt}` : 'Review date unavailable';
  const scope = evidence.causalScope ? `; causal scope: ${evidence.causalScope}` : '';

  return (
    <span
      className={`badge evidence-${evidence.confidence}`}
      title={`${evidence.notes ?? 'No notes'} ${review}${scope}`}
      aria-label={`${labelByType[evidence.evidenceType]} (${evidence.confidence}); ${review}${scope}`}
    >
      {labelByType[evidence.evidenceType]} ({evidence.confidence})
      {evidence.reviewStatus === 'reviewed' ? `; ${review}` : ''}
    </span>
  );
};
