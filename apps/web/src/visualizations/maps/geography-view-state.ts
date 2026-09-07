export const hasSpeciesSpecificEvidence = ({
  registryRecordCount,
  mappedRangeCount,
}: {
  registryRecordCount: number;
  mappedRangeCount: number;
}): boolean => registryRecordCount > 0 || mappedRangeCount > 0;
