# Data Flow

1. Curated seed and SQL migration/seed scripts define canonical sample data.
2. ClickHouse stores normalized entities and evidence/citation links.
3. API repositories query ClickHouse with parameterized queries.
4. Repositories map rows to domain objects.
5. Routes return an API envelope (`data`, `meta`).
6. Web app fetches envelope data through a service adapter.
7. Visualization adapters convert domain models to renderer-specific models.

## Development fallback

When `VITE_DATA_MODE=mock`, the web app uses the shared domain seed through a mock API adapter with the same contracts.
