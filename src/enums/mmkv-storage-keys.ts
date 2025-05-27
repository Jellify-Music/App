/**
 * An enum of all the keys used with MMKV storage.
 */
export enum MMKVStorageKeys {
	PlayQueue = 'PLAY_QUEUE',
	Server = 'SERVER',
	User = 'USER',
	Library = 'LIBRARY',
	NowPlaying = 'NowPlaying',
	Queue = 'Queue',
	CurrentIndex = 'CurrentIndex',
	Api = 'Api',
	LibrarySortDescending = 'LibrarySortDescending',
	LibraryIsFavorites = 'LibraryIsFavorites',
	SendMetrics = 'SEND_METRICS',
	AutoDownload = 'AutoDownload',
	LibraryIsDownloaded = 'LibraryIsDownloaded',
	DevTools = 'DevTools',
	LibraryArtistPageParam = 'LibraryArtistPageParam',
	// Crossfade settings
	CrossfadeEnabled = 'CrossfadeEnabled',
	CrossfadeDuration = 'CrossfadeDuration',
	CrossfadeCurve = 'CrossfadeCurve',
	AutoCrossfade = 'AutoCrossfade',
}
