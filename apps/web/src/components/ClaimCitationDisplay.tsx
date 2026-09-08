import type { ClaimAssertion, Citation } from '@venom-atlas/domain';

type DisplayAssertion = ClaimAssertion & { citations: Citation[] };

const assertionValue = (assertion: ClaimAssertion) => {
  if (assertion.value.kind === 'number') {
    return `${assertion.value.amount} ${assertion.value.unit}`;
  }
  if (assertion.value.kind === 'text') {
    return assertion.value.text;
  }
  return assertion.value.detail ?? assertion.value.reason.replaceAll('_', ' ');
};

export const ClaimCitationDisplay = ({ assertions }: { assertions: DisplayAssertion[] }) => {
  if (assertions.length === 0) {
    return null;
  }

  return (
    <div className="claim-assertions">
      {assertions.map((assertion) => (
        <details className="atlas-local-sources" id={assertion.id} key={assertion.id}>
          <summary>{assertion.label}: evidence record</summary>
          <p>{assertionValue(assertion)}</p>
          <p><strong>Applicability:</strong> {assertion.applicability.summary}</p>
          {assertion.conditions.map((condition) => (
            <p key={condition.name}><strong>{condition.name}:</strong> {condition.value}</p>
          ))}
          <ul>
            {assertion.sourceLocators.map((locator) => {
              const citation = assertion.citations.find((entry) => entry.id === locator.citationId);
              return (
                <li key={`${assertion.id}-${locator.citationId}-${locator.locator}`}>
                  {citation?.url ? <a href={citation.url} target="_blank" rel="noreferrer">{citation.title}</a> : citation?.title ?? locator.citationId}
                  {` — ${locator.locator}`}
                  {locator.sourceVersionDate ? ` (source version ${locator.sourceVersionDate})` : ''}
                </li>
              );
            })}
          </ul>
          <p className="muted">
            {assertion.provenance.method.replaceAll('_', ' ')} · retrieved {assertion.provenance.retrievedAt.slice(0, 10)}
            {assertion.provenance.generatedAt ? ` · generated ${assertion.provenance.generatedAt.slice(0, 10)}` : ''}
            {` · checked ${assertion.validation.checkedAt.slice(0, 10)} · ${assertion.validation.status}`}
          </p>
          {assertion.provenance.model ? <p className="muted">Model: {assertion.provenance.model}; prompt: {assertion.provenance.promptVersion}</p> : null}
          {assertion.alternatives?.map((alternative) => (
            <p key={alternative.value}><strong>Conflicting finding:</strong> {alternative.value}. {alternative.note}</p>
          ))}
        </details>
      ))}
    </div>
  );
};