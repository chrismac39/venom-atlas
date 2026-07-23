import { useEffect, useState } from 'react';
import type { Citation } from '@venom-atlas/domain';
import { atlasApi } from '../services/apiClient';

export const CitationList = ({ citationIds }: { citationIds: string[] }) => {
  const [citations, setCitations] = useState<Citation[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all(citationIds.map((id) => atlasApi.getCitation(id)))
      .then((rows) => {
        if (mounted) {
          setCitations(rows);
        }
      })
      .catch(() => {
        if (mounted) {
          setCitations([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [citationIds]);

  if (citationIds.length === 0) {
    return <p className="muted">No source citations linked.</p>;
  }

  return (
    <ul>
      {citations.map((citation) => (
        <li key={citation.id}>
          <strong>{citation.title}</strong>
          {citation.publicationYear ? ` (${citation.publicationYear})` : ''}
          {citation.url ? (
            <>
              {' '}
              <a href={citation.url} target="_blank" rel="noreferrer">
                Source
              </a>
            </>
          ) : (
            <span className="muted"> Source URL unavailable</span>
          )}
        </li>
      ))}
    </ul>
  );
};
