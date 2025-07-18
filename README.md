# Candidate Notes
## Implemented Features
**`energyByBlock`** Query
- Implements: "Provide the energy consumption per transaction for a specific block."

- Given a block hash, retrieves transactions and returns energy usage per transaction (based on size × 4.56 kWh).

**`dailyEnergyUsage`** Query
- Implements: "Provide the total energy consumption per day in the last x number of days."

- Calculates energy usage per day by summing all transaction sizes in all blocks for that day.

- Currently, it retrieves the last N days retrospectively (e.g., today and the past N - 1). In the future, this can be extended to support querying energy usage for a specific date range or fixed day.

- Today’s blocks are never cached since the data may still be changing. In the future, we could implement a short-lived cache tier (e.g., 5-minute TTL) or append new blocks incrementally as frontend requests come in.

## Implementation Notes
### 1. Validation and Error Handling
- Queries are safely validated (e.g.,**`MAX_QUERIABLE_DAYS`**) with early GraphQL error throws.

- Axios error handling for cache and API fetches is defensive and includes logging.

### 2. Parallelization
- Daily energy usage calculation is fully parallelized using **`Promise.all()`** for both:

  - Block-level fetching per day

  - Transaction energy computation per block

### 3. Utilities
- Timestamp and date formatting is handled via utility functions for clean UTC day boundary alignment.

- Typed schema created via **`graphql-compose`** enables modular design and type safety

### 4. Environment Setup
- Local dev setup uses:
  - Node 16
  - Yarn
  - Serverless

- GraphQL server runs on **`http://localhost:4000/graphql`**
- Cache server runs on **`http://localhost:4001`**

- Run both GraphQL and Cache servers locally with a single `yarn start` command using `concurrently`.

## Caching Strategy
- Implemented a mock cache server using lru-cache via a separate Express server.

- Types of cached items:

  - **`block`**: raw block data from /rawblock/:hash

  - **`dailyBlocks`**: daily block summaries from /blocks/:timestamp

  - **`dailySummary`**: energy summary for a specific date

- The cache has configurable TTL (default: 24h) and maximum size (e.g., 1000 for block cache).

- In production, this mock cache should be replaced by Redis on AWS, likely deployed as a separate service.

## Cache Notes:
- In my tests, large block sizes caused heap allocation issues after caching ~5 days of data. I left it as-is to stay within the time budget, but it highlights the limitations of in-memory caching at scale.

- In a production environment, we should define explicit cache eviction strategies. Combining Redis with TTL-based expiry is a good baseline. For long-term storage of daily summaries, we could offload to S3 or a database and hydrate the cache on demand.

- The current setup uses `lru-cache`, which evicts the least recently used entries when the max size is exceeded. This is fine for local development and short-term runs.

- Once TTL expires, cache entries are evicted automatically. For historical analytics, we should persist expired entries (e.g., to S3 or a database) for long-term access.

- **`concurrently`** was added so both the GraphQL server and cache server can be started via yarn start.

- **Suggestion**: merge **`block`** and **`dailyBlocks`** cache types for simplicity/efficiency in production.

## Query Limits / Performance Notes
- Daily energy computation is fully parallelized both per block and per day to optimize API latency.

- Max number of queriable days at once is hard-limited to 2 (due to Lambda timeout ~29s).

- Fetching 2 days worth of blocks can take ~25s; beyond this, requests may fail due to deadline. I recommend lowering this to 1 day for reliability. To improve UX and responsiveness, the frontend can implement:

  - Paginate day queries

  - Use lazy loading/sliding window (e.g., fetch day 3 while user is viewing day 2)

  - Chunked queries with batch appending

## Tooling / Developer Experience
- **`concurrently`** is used to run both API and cache server from a single command.

- API uses **`graphql-compose`** and **`graphql-helix`**.

- All functionality is isolated and cached for performance & scalability.

## Limitations & Future Work
- Energy consumption per wallet address is not implemented (marked as Expert Feature). Could be done using the `/rawaddr/:address` endpoint with pagination and block lookup.
- Advanced caching could include persistence (e.g., Redis + S3 fallback) and cache warming.
- Error messages could be extended with error codes for frontend handling.
- Add unit/integration tests for key utility functions and cache access logic. Due to time constraints this wasn't included.