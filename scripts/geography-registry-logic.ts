export type DistributionStatus = 'native' | 'introduced' | 'uncertain' | 'recorded_presence';
export type DistributionDerivation = 'occurrence_point_aggregation' | 'source_native_admin1' | 'source_native_scope_to_admin1' | 'curated_source';

export const classifyOccurrenceStatus = ({
  isNativeEvidence,
  existingStatus,
  existingDerivation,
}: {
  isNativeEvidence: boolean;
  existingStatus?: DistributionStatus;
  existingDerivation?: DistributionDerivation;
}): DistributionStatus => {
  if (existingDerivation === 'curated_source' && existingStatus) {
    return existingStatus;
  }
  if (isNativeEvidence) {
    return 'native';
  }
  return existingStatus ?? 'recorded_presence';
};

export const mergeEvidenceIds = (...evidenceIdGroups: Array<string[] | string>): string[] => {
  return [...new Set(evidenceIdGroups.flatMap((group) => group))];
};
