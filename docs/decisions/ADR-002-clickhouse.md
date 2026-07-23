# ADR-002: ClickHouse for curated scientific atlas data

## Status

Accepted

## Decision

Use ClickHouse with MergeTree tables and parameterized query access via `@clickhouse/client`.

## Rationale

The project targets scientific visualization and potentially larger observational datasets where analytical query performance and clear table-oriented provenance are useful.

## Consequences

- SQL migration/seed scripts are first-class artifacts.
- Repository layer performs row-to-domain mapping before API responses.
