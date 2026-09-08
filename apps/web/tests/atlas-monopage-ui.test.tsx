import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AtlasMonopageIsland } from '../src/islands/AtlasMonopageIsland';
import { atlasSections } from '../src/features/atlas/atlas-types';
import { atlasLegacyBookmarks, canonicalAtlasSectionId } from '../src/features/atlas/hooks/useAtlasMonopageOrchestration';
import { atlasUiFixture, fixtureCitation } from './fixtures/atlas-ui-fixture';

vi.mock('../src/visualizations/maps/RangeMapPanel', () => ({ RangeMapPanel: () => <div>Fixture map</div> }));

const scrollIntoView = vi.fn();
beforeEach(() => {
  window.history.replaceState(null, '', '/atlas/fixture-organism');
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  Element.prototype.scrollIntoView = scrollIntoView;
  scrollIntoView.mockClear();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('four-section atlas dossier', () => {
  it('renders exactly four ordered primary headings and navigation links, including SSR', () => {
    const fixture = atlasUiFixture();
    const { container } = render(<AtlasMonopageIsland organism={fixture} />);
    expect(screen.getAllByRole('heading', { level: 2 }).map((node) => node.textContent)).toEqual(atlasSections.map((section) => section.title));
    const links = within(screen.getByRole('navigation', { name: 'Organism sections' })).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual(atlasSections.map((section) => [section.title, `#${section.id}`]));
    expect(container.querySelectorAll('article > section')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Change organism' }).getAttribute('href')).toBe('/');
    expect(screen.getAllByText(fixture.overview)).toHaveLength(1);
    expect(container.querySelector('.atlas-global-summary-pills, .atlas-coverage, .atlas-organism-hero')).toBeNull();
    expect(screen.queryByText('At a glance')).toBeNull();
    expect(screen.queryByText(/Open dedicated/)).toBeNull();
    expect(screen.queryByLabelText('Urgent medical context')).toBeNull();
    expect(container.querySelector('svg, canvas')).toBeNull();
    const html = new DOMParser().parseFromString(renderToStaticMarkup(<AtlasMonopageIsland organism={fixture} />), 'text/html');
    expect([...html.querySelectorAll('h2')].map((node) => node.textContent)).toEqual(atlasSections.map((section) => section.title));
  });

  it('keeps substantive claims and their sources within the corresponding section and scope', () => {
    const { container } = render(<AtlasMonopageIsland organism={atlasUiFixture()} />);
    const placements = {
      'section-summary': ['Fixture organism overview.', 'Fixture natural history.', 'Fixture ecology description.', 'Fixture delivery summary.', 'organism reference', 'delivery reference'],
      'section-geography': ['Fixture range description.', 'Fixture source precision limitation.', 'Fixture habitat description.', 'range reference', 'audit reference'],
      'section-chemistry': ['Fixture material description.', 'Fixture component description.', 'molecular-step description', 'compound-step description', 'Fixture target description.', 'material reference', 'component reference', 'toxin reference', 'identity reference', 'structure reference', 'target reference', 'molecular-step reference', 'compound-step reference'],
      'section-medical-effects': ['exposure-step description', 'clinical-step description', 'Fixture effect description.', 'Fixture symptom description.', 'exposure-step reference', 'clinical-step reference', 'effect reference', 'symptom reference'],
    };
    for (const [id, texts] of Object.entries(placements)) {
      const section = container.querySelector(`#${id}`)!;
      for (const text of texts) {
        expect(within(section as HTMLElement).getAllByText(text).length).toBeGreaterThan(0);
        for (const node of screen.getAllByText(text)) expect(node.closest('[data-scroll-section]')?.id).toBe(id);
      }
    }
    expect(container.querySelector('#chemistry-material')?.tagName).toBe('DETAILS');
    expect(screen.getByText('molecular-step description').closest('details')?.querySelector('summary')?.textContent).toBe('Molecular targets and mechanisms');
    expect(screen.getByText('compound-step description').parentElement?.textContent).toContain('isolated compound');
    expect(screen.getByText('clinical-step description').closest('#section-chemistry')).toBeNull();
    expect(container.querySelector('#section-sources')).toBeNull();
  });

  it.each([1, 3, 6])('preserves all %i delivery steps instead of requiring or truncating to four', (count) => {
    const fixture = atlasUiFixture();
    fixture.deliveryMechanism.sequence = fixture.deliveryMechanism.sequence.slice(0, count);
    render(<AtlasMonopageIsland organism={fixture} />);
    const sequence = screen.getByRole('list', { name: 'Delivery sequence' });
    expect(within(sequence).getAllByRole('listitem').map((item) => item.textContent)).toEqual(fixture.deliveryMechanism.sequence);
    expect(sequence.closest('[data-scroll-section]')?.id).toBe('section-summary');
  });

  it('does not let an internal citation escape its local disclosure', () => {
    const fixture = atlasUiFixture();
    fixture.provenance.citations.push({ ...fixtureCitation('internal'), visibility: 'internal' });
    render(<AtlasMonopageIsland organism={fixture} />);
    expect(screen.queryByText('internal reference')).toBeNull();
  });

  it('preserves toxin selection, unrelated query state and canonical bookmarks across navigation', () => {
    const fixture = atlasUiFixture();
    fixture.toxins.push({ ...fixture.toxins[0]!, id: 'second', slug: 'second', displayName: 'Second fixture toxin' });
    window.history.replaceState({ fixture: true }, '', '/atlas/fixture-organism?toxin=second&keep=yes#section-toxin-charts');
    render(<AtlasMonopageIsland organism={fixture} />);
    expect((screen.getByLabelText('Chemical component selector') as HTMLSelectElement).value).toBe('second');
    expect(window.location.hash).toBe('#section-chemistry');
    fireEvent.change(screen.getByLabelText('Chemical component selector'), { target: { value: 'fixture-toxin' } });
    expect(window.location.search).toBe('?toxin=fixture-toxin&keep=yes');
    expect(window.history.state).toEqual({ fixture: true });
    act(() => {
      window.history.replaceState(null, '', '?toxin=second#section-human-physiology');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect((screen.getByLabelText('Chemical component selector') as HTMLSelectElement).value).toBe('second');
    expect(window.location.hash).toBe('#section-medical-effects');
  });

  it.each(Object.entries(atlasLegacyBookmarks))('maps %s on initial load and later hash changes', (alias, canonical) => {
    window.history.replaceState(null, '', `/atlas/fixture-organism?keep=yes#${alias}`);
    const { container } = render(<AtlasMonopageIsland organism={atlasUiFixture()} />);
    expect(container.querySelector(`#${alias}`)?.closest('[data-scroll-section]')?.id).toBe(canonical);
    expect(window.location.hash).toBe(`#${canonical}`);
    expect(window.location.search).toBe('?keep=yes');
    expect(document.activeElement?.id).toBe(canonical);
    const material = container.querySelector<HTMLDetailsElement>('#chemistry-material')!;
    material.open = false;
    act(() => {
      window.history.replaceState(null, '', `#${alias}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(window.location.hash).toBe(`#${canonical}`);
    if (/toxin-(charts|categorization)/.test(alias)) expect(material.open).toBe(true);
    expect(scrollIntoView).toHaveBeenCalled();
    expect(canonicalAtlasSectionId(`#${alias.replace('section-', '')}`)).toBe(canonical);
  });

  it('ignores unknown/malformed bookmarks and does not fabricate unavailable scientific text', () => {
    expect(canonicalAtlasSectionId('#%E0%A4%A')).toBeNull();
    expect(canonicalAtlasSectionId('#unknown')).toBeNull();
    const fixture = atlasUiFixture();
    fixture.toxins = [];
    fixture.toxicMaterial = null;
    fixture.mechanismSteps = [];
    fixture.physiology = null;
    render(<AtlasMonopageIsland organism={fixture} />);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);
    expect(screen.queryByLabelText('Chemical component selector')).toBeNull();
    expect(screen.queryByText(/No toxin is linked|not available for this toxin|Severe allergic reactions/)).toBeNull();
  });
});