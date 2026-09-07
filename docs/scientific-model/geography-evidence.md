# Geography Evidence

The atlas uses subnational ADM1 regions as its mapping standard, but it keeps evidence classes separate:

- `recorded_presence`: a reusable-license occurrence point was assigned to an ADM1 region.
- `native`: a native-country occurrence point was assigned to an ADM1 region, or a curated native range source was intersected with that region.
- `introduced`: an introduced-range source or occurrence assignment supports the ADM1 region.
- `uncertain`: evidence supports a possible region but does not justify a native or introduced claim.

A country-level source statement must not be expanded into every ADM1 polygon. When no authoritative range polygon is available, the registry uses only point-supported ADM1 units and leaves the remaining country regions neutral.

Future curated range sources may be attached to a geography range with `sourceGeometryAssetPath`. Those GeoJSON assets must be local, cite their source, and be intersected with the local geoBoundaries ADM1 layer during registry generation. The source geometry should remain distinct from GBIF point evidence so the UI can show both provenance paths.

For `Solenopsis invicta`, the current native layer follows the conservative point-supported path. The source-described native countries are configured in `content-source/geography/solenopsis-invicta.yaml`; they provide context for classifying native-country observations but do not fill unobserved ADM1 regions.

## Oceanic Species

Oceanic species should not be forced into the terrestrial ADM1 model. Their map should stay deliberately simple:

- occurrence records render as ocean dots;
- authoritative source ranges render as local marine polygons or a defined ocean grid;
- dots and areas remain separate layers with separate provenance;
- native, introduced, uncertain, or other status labels are used only when the source supports them.

For wide-ranging pelagic species, a filled ocean cell means evidence assigned to that cell, not continuous occupancy. Country borders, EEZs, coastlines, and ADM1 polygons can remain contextual overlays, but they must not define the species range. Depth, feeding, migration, and other ecological detail belong in separate atlas sections rather than in the geography map contract.

## Marine Standards To Leverage

There is no single marine equivalent of terrestrial ADM1, so the atlas should keep three purposes separate:

- **Marine Regions / IHO areas:** authoritative named sea areas, maritime boundaries, EEZs, and other contextual boundaries. These are useful for labels and orientation, but an EEZ or reporting boundary is not automatically a biological range.
- **OGC Discrete Global Grid System (DGGS):** the standards framework for stable hierarchical global grid identifiers. The atlas should use an existing DGGS implementation and its published cell geometries; it must not invent a private 5-degree or other custom tessellation.
- **Marine ecoregions:** MEOW, Large Marine Ecosystems, and comparable published classifications can be used when a source explicitly describes a species range in those units. They should remain source-defined areas, not a universal replacement for the grid.

FAO, ICES, OSPAR, and similar management or statistical areas are useful provenance and context layers, but should not be treated as range boundaries without biological evidence. In practice, the first marine implementation should use occurrence dots plus cells from a selected existing DGGS implementation, with Marine Regions boundaries available as optional context.

### Practical Marine Cell Scales

The atlas should not materialize a global 1 km ocean grid. The ocean surface is roughly 361 million square kilometres, so that approach would create hundreds of millions of possible cells before any species data is applied.

Useful starting scales are much coarser:

| Grid | Global cells before land masking | Approximate equatorial cell width | Use |
| --- | ---: | ---: | --- |
| 10-degree lon/lat | 648 | 1,110 km | Very broad pelagic overview |
| 5-degree lon/lat | 2,592 | 556 km | Recommended first global evidence grid |
| 2-degree lon/lat | 16,200 | 222 km | Regional detail when evidence density supports it |
| 1-degree lon/lat | 64,800 | 111 km | Fine regional work, not the default global layer |

These are comparison scales, not a proposal to create a private grid. The registry should be sparse and store only cells containing occurrence or source-area evidence. For an existing equal-area DGGS, select a published resolution in the tens of thousands of square kilometres and preserve its native cell IDs and geometries. The map can show dots at full resolution and aggregate them into those existing cells only when an area layer is useful.

OGC DGGS is a standard for how a discrete global grid system is identified and queried, not one mandatory world tessellation. The implementation decision must therefore name the selected existing DGGS, version, resolution, geometry asset, and license before marine records are authored.

### Recommended Marine DGGRS

The recommended first DGGRS is **OGC ISEA3H** (`https://www.opengis.net/def/dggrs/OGC/1.0/ISEA3H`). It is the strongest fit for the atlas because it is an OGC-defined equal-area hierarchy, has explicit stable text and 64-bit identifiers, and is used in the OGC DGGS examples for global and marine geospatial data. It also gives the implementation a clear path to standards-based zone queries and GeoJSON zone geometry.

ISEA3H is not a uniform hexagon grid everywhere: it has twelve polar pentagons, and those pentagons are smaller than same-level hexagons. That is acceptable for evidence aggregation, but the UI and registry must use the published cell area and geometry rather than assuming every cell has identical area. The atlas should pin the OGC ISEA3H definition, choose a coarse published refinement level for the first marine layer, and vendor or generate the corresponding geometry asset through a documented standards-based toolchain.

rHEALPix remains a reasonable alternative if square-like cells or HEALPix interoperability become important. H3 remains useful for operational indexing, but it is not the default scientific range grid here because its hierarchy is approximate geometrically and it is not the selected OGC DGGRS definition.
