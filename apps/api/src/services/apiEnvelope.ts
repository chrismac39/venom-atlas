export interface ApiEnvelope<T> {
  data: T;
  meta?: {
    generatedAt: string;
  };
}

export const ok = <T>(data: T): ApiEnvelope<T> => ({
  data,
  meta: {
    generatedAt: new Date().toISOString(),
  },
});
