# queries

This folder contains all React Query hooks used to fetch data from the Jellyfin server. Each subfolder covers one domain entity (`artist`, `album`, `track`, `genre`, `playlist`, etc.) and follows the same internal structure.

**Relevant docs:**
- [TanStack Query — Queries](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
- [TanStack Query — Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)

---

## Folder structure

Each entity folder is organized in layers, from the hook consumed by components down to the raw HTTP call:

| File | Description |
|---|---|
| `index.ts` | **Hooks.** The only exports components should import (e.g. `useAlbumArtists`, `useAlbums`, `useTracks`). Wraps `useQuery`/`useInfiniteQuery`, reads any required state (filters, sort, library) from stores, and wires it into a `queryFn` |
| `keys.ts` | Query key builder functions (e.g. `ArtistQueryKey`, `TracksQueryKey`). Centralizing key construction here means the same key can be reused elsewhere for cache reads/writes (`queryClient.getQueryData`, `queryClient.setQueryData`, invalidation, etc.) |
| `queries.ts` | *(optional)* Plain query-option objects shared by more than one hook or reused outside of a component (e.g. prefetching). Not every entity needs this layer |
| `utils/` | **Fetch functions.** Plain async functions that call the Jellyfin SDK (`getItemsApi`, `getArtistsApi`, etc.) directly and return plain data (`BaseItemDto[]`, etc.). These have no knowledge of React Query — they just take explicit params (api, user, library, page, filters, signal) and resolve/reject a promise |

The hook is the only layer that talks to React Query; everything below `index.ts` is framework-agnostic and could be called imperatively (which is exactly what the letter-cursor jump described below does).

A couple of folders are exceptions to this pattern:
- `item.ts` — generic single-item fetch/query helpers shared across entities, kept flat since it isn't its own domain
- `image/` — only has a `utils/` layer since it exposes fetch helpers, not hooks

---

## Infinite queries

List screens (artists, albums, tracks, genres, etc.) use `useInfiniteQuery` with a numeric `pageParam` that represents a page index, not an item offset:

```ts
queryFn: ({ pageParam, signal }) =>
  fetchArtists(user, library, pageParam, isFavorite, sortBy, sortOrder, signal),
getNextPageParam: (lastPage, allPages, lastPageParam) =>
  lastPage.length === ApiLimits.Library ? lastPageParam + 1 : undefined,
```

- **`ApiLimits`** ([configs/querying/index.config.ts](../../configs/querying/index.config.ts)) defines the page size per entity (e.g. `ApiLimits.Library`). The fetch util converts `pageParam` into a real offset: `startIndex: pageParam * ApiLimits.Library`
- **`MaxPages`** caps how many pages are kept in the query's cache at once (via the `maxPages` option); older pages are dropped as new ones are fetched, keeping memory bounded on long lists
- `select` commonly flattens `InfiniteData` pages into a single array (`flattenInfiniteQueryPages`), optionally grouping items into `LibrarySectionListData[]` sections for an A-Z section list

### Letter cursor (A-Z scroller jump)

The A-Z scroller (`components/Global/components/AZScroller`) needs to jump straight to the page containing a tapped letter instead of paginating through every page in between. `fetchNextPage` in TanStack Query only supports fetching forward/backward from the last known page, so entities that back a section list also build a [`LetterCursor`](../../types/LetterCursor.ts) and attach it to the query result:

```ts
const query = useInfiniteQuery({ queryKey, ... })

const letterCursor: LetterCursor = {
  queryKey,
  fetchPage: (page, signal) => fetchArtists(user, library, page, ...),
  countBeforeLetter: (letter, signal) => fetchArtistsCountBeforeLetter(user, library, letter, ...),
}

return Object.assign(query, { letterCursor })
```

- `countBeforeLetter` asks the Jellyfin API for the exact number of items sorted before a given letter, using `nameLessThan` + `enableTotalRecordCount` with `limit: 1` — a single lightweight request instead of walking pages one by one
- The page containing that letter is then `Math.floor(itemsBeforeLetter / ApiLimits.Library)`
- `fetchPage` fetches that one page directly, and the result is merged into the query's cache with `queryClient.setQueryData` (see [AZScroller/utils.ts](../../components/Global/components/AZScroller/utils.ts)), trimming to `MaxPages.Library` the same way react-query's own `maxPages` option would

Because `letterCursor` is just attached to the existing query object, components pass the query through unchanged and the section list/scroller widen their prop types to `UseInfiniteQueryResult<...> & { letterCursor: LetterCursor }` where needed.
