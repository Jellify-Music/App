import { LibraryProvider } from '../providers/Library'

/**
 * An enum of all the keys of query functions.
 */
export enum QueryKeys {
	AddToQueue = 'ADD_TO_QUEUE',
	AlbumTracks = 'ALBUM_TRACKS',
	Api = 'API',
	ArtistAlbums = 'ARTIST_ALBUMS',
	ArtistById = 'ARTIST_BY_ID',
	Credentials = 'CREDENTIALS',

	/**
	 * @deprecated React Native Fast Image is being used instead of
	 * querying for the images with Tanstack
	 */
	ItemImage = 'IMAGE_BY_ITEM_ID',
	Libraries = 'LIBRARIES',
	Pause = 'PAUSE',
	Play = 'PLAY',

	/**
	 * Query representing the fetching of a user's created playlists.
	 *
	 * Invalidation occurs by providing this query key
	 */
	Playlists = 'PLAYLISTS',
	Progress = 'PROGRESS',
	PlayQueue = 'PLAY_QUEUE',
	PublicApi = 'PUBLIC_API',
	PublicSystemInfo = 'PUBLIC_SYSTEM_INFO',
	RemoveFromQueue = 'REMOVE_FROM_QUEUE',
	RemoveMultipleFromQueue = 'REMOVE_MULTIPLE_FROM_QUEUE',
	ReportPlaybackPosition = 'REPORT_PLAYBACK_POSITION',
	ReportPlaybackStarted = 'REPORT_PLAYBACK_STARTED',
	ReportPlaybackStopped = 'REPORT_PLAYBACK_STOPPED',
	ServerUrl = 'SERVER_URL',
	Playlist = 'Playlist',
	RecentlyPlayed = 'RecentlyPlayed',
	RecentlyPlayedArtists = 'RecentlyPlayedArtists',
	ArtistFeaturedAlbums = 'ArtistFeaturedAlbums',
	ArtistImage = 'ArtistImage',
	PlaybackStateChange = 'PlaybackStateChange',
	Player = 'Player',
	NetworkStatus = 'NetworkStatus',

	/**
	 * @deprecated Use Playlists instead
	 */
	UserPlaylists = 'UserPlaylists',

	/**
	 * Query representing the fetching of tracks for an album or playlist.
	 *
	 * Invalidation occurs when the ID of the album or playlist is provided
	 * as a query key
	 */
	ItemTracks = 'ItemTracks',
	RefreshHome = 'RefreshHome',
	FavoriteArtists = 'FavoriteArtists',
	FavoriteAlbums = 'FavoriteAlbums',
	FavoriteTracks = 'FavoriteTracks',
	UserData = 'UserData',
	UpdatePlayerOptions = 'UpdatePlayerOptions',
	Item = 'Item',
	Search = 'Search',
	SearchSuggestions = 'SearchSuggestions',
	FavoritePlaylists = 'FavoritePlaylists',
	UserViews = 'UserViews',
	Audio = 'Audio',
	RecentlyAdded = 'RecentlyAdded',
	SimilarItems = 'SimilarItems',
	AudioCache = 'AudioCache',
	MediaSources = 'MediaSources',
	FrequentArtists = 'FrequentArtists',
	FrequentlyPlayed = 'FrequentlyPlayed',
	InstantMix = 'InstantMix',

	/**
	 * Query representing a cache of playlist items used to check if tracks
	 * are already in playlists to prevent adding duplicates
	 */
	PlaylistItemCheckCache = 'PlaylistItemCheckCache',
	ArtistFeaturedOn = 'ArtistFeaturedOn',
	AllArtists = 'AllArtists',
	AllTracks = 'AllTracks',
	AllAlbums = 'AllAlbums',
	StorageInUse = 'StorageInUse',
	Patrons = 'Patrons',

	/**
	 * @deprecated Use {@link InfiniteArtists} instead
	 */
	AllArtistsAlphabetical = 'AllArtistsAlphabetical',

	/**
	 * @deprecated Use {@link InfiniteAlbums} instead after refactoring
	 * the infinite query in the {@link LibraryProvider}
	 */
	AllAlbumsAlphabetical = 'AllAlbumsAlphabetical',
	RecentlyAddedAlbums = 'RecentlyAddedAlbums',
	PublicPlaylists = 'PublicPlaylists',

	/**
	 * Query representing the fetching of artists in an infinite query
	 */
	InfiniteArtists = 'InfiniteArtists',

	/**
	 * Query representing the fetching of albums in an infinite query
	 */
	InfiniteAlbums = 'InfiniteAlbums',

	/**
	 * Query representing the fetching of suggested artists in an infinite query
	 */
	InfiniteSuggestedArtists = 'InfiniteSuggestedArtists',
	Album = 'Album',
	TrackArtists = 'TrackArtists',
}
