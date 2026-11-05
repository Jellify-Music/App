export const MAX_RETRY_ATTEMPTS = 2

export enum MaxPages {
	Home = 2,
	Library = 5,
}

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum ApiLimits {
	Discover = 50,
	Recents = 50,
	Frequents = 200,
	Library = 400,
	Similar = 30,
	LibraryShuffle = 50,
	Items = 250,
	InstantMix = 50,
	Search = 50, // TODO: make this a paginated search so limits don't even matter
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */
