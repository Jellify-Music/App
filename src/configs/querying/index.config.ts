export const MAX_RETRY_ATTEMPTS = 2

export enum MaxPages {
	Home = 2,
	Library = 5,
}

/**
 * How long library-wide lists stay in memory once nothing is observing them.
 * These can hold thousands of items, so they aren't kept for the default day.
 */
export const LIBRARY_GC_TIME = 1000 * 60 * 10

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum ApiLimits {
	Discover = 50,
	Recents = 50,
	Frequents = 200,
	Library = 400,
	Similar = 10,
	LibraryShuffle = 50,
	Items = 250,
	InstantMix = 50,
	Search = 50, // TODO: make this a paginated search so limits don't even matter
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */
