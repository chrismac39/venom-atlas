import type { Citation } from '@venom-atlas/domain';

export const CitationList = ({ citations }: { citations: Citation[] }) => {
  if (citations.length === 0) {
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
