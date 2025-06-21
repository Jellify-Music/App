import { QueryKeys } from '../enums/query-keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack'
import { Queue } from '../player/types/queue-item'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import { InfiniteData } from '@tanstack/react-query'
export type StackParamList = {
	Login: {
		screen: keyof StackParamList
	}
	ServerAddress: undefined
	ServerAuthentication: undefined

	LibrarySelection: undefined

	HomeScreen: undefined
	Home: undefined
	AddPlaylist: undefined
	RecentArtists: {
		artists: BaseItemDto[] | undefined
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
	}
	MostPlayedArtists: {
		artists: BaseItemDto[] | undefined
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
	}
	RecentTracks: {
		tracks: InfiniteData<BaseItemDto[], unknown> | undefined
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
	}
	MostPlayedTracks: {
		tracks: InfiniteData<BaseItemDto[], unknown> | undefined
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
	}
	UserPlaylists: {
		playlists: BaseItemDto[]
	}

	Tracks: {
		tracks: InfiniteData<BaseItemDto[], unknown> | undefined
		queue: Queue
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
	}

	Discover: undefined
	RecentlyAdded: {
		albums: BaseItemDto[] | undefined
		navigation: StackNavigationProp<StackParamList>
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
		isFetchingNextPage: boolean
	}

	LibraryScreen: undefined
	Library: undefined

	DeletePlaylist: {
		playlist: BaseItemDto
	}

	Search: undefined

	Settings: undefined
	Account: undefined
	Server: undefined
	Playback: undefined
	Labs: undefined
	SignOut: undefined

	Tabs: {
		screen: keyof StackParamList
		params: object
	}

	PlayerScreen: undefined
	Player: undefined
	Queue: undefined

	Artist: {
		artist: BaseItemDto
	}
	ArtistAlbums: undefined
	ArtistEps: undefined
	ArtistFeaturedOn: undefined

	SimilarArtists: {
		artist: BaseItemDto
		navigation: StackNavigationProp<StackParamList>
	}

	Album: {
		album: BaseItemDto
	}
	Playlist: {
		playlist: BaseItemDto
	}
	Details: {
		item: BaseItemDto
		isNested: boolean | undefined
	}
	Offline: undefined
	InstantMix: {
		item: BaseItemDto
		mix: BaseItemDto[]
	}
}

export type LoginProps = StackScreenProps<StackParamList, 'Login'>
export type ServerAddressProps = StackScreenProps<StackParamList, 'ServerAddress'>
export type ServerAuthenticationProps = StackScreenProps<StackParamList, 'ServerAuthentication'>
export type LibrarySelectionProps = StackScreenProps<StackParamList, 'LibrarySelection'>

export type TabProps = StackScreenProps<StackParamList, 'Tabs'>
export type PlayerProps = StackScreenProps<StackParamList, 'Player'>

export type ProvidedHomeProps = StackScreenProps<StackParamList, 'HomeScreen'>
export type AddPlaylistProps = StackScreenProps<StackParamList, 'AddPlaylist'>
export type RecentArtistsProps = StackScreenProps<StackParamList, 'RecentArtists'>
export type RecentTracksProps = StackScreenProps<StackParamList, 'RecentTracks'>
export type MostPlayedArtistsProps = StackScreenProps<StackParamList, 'MostPlayedArtists'>
export type MostPlayedTracksProps = StackScreenProps<StackParamList, 'MostPlayedTracks'>
export type UserPlaylistsProps = StackScreenProps<StackParamList, 'UserPlaylists'>

export type DiscoverProps = StackScreenProps<StackParamList, 'Discover'>
export type RecentlyAddedProps = StackScreenProps<StackParamList, 'RecentlyAdded'>
export type HomeArtistProps = StackScreenProps<StackParamList, 'Artist'>
export type ArtistAlbumsProps = StackScreenProps<StackParamList, 'ArtistAlbums'>
export type ArtistEpsProps = StackScreenProps<StackParamList, 'ArtistEps'>
export type ArtistFeaturedOnProps = StackScreenProps<StackParamList, 'ArtistFeaturedOn'>

export type HomeAlbumProps = StackScreenProps<StackParamList, 'Album'>

export type HomePlaylistProps = StackScreenProps<StackParamList, 'Playlist'>

export type QueueProps = StackScreenProps<StackParamList, 'Queue'>

export type LibraryProps = StackScreenProps<StackParamList, 'LibraryScreen'>
export type TracksProps = StackScreenProps<StackParamList, 'Tracks'>

export type ArtistsProps = {
	artists: (string | number | BaseItemDto)[] | undefined
	navigation: StackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
	showAlphabeticalSelector: boolean
}
export type AlbumsProps = {
	albums: (string | number | BaseItemDto)[] | undefined
	navigation: StackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
	showAlphabeticalSelector: boolean
}
export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	navigation: StackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
export type PlaylistsProps = {
	playlists: InfiniteData<BaseItemDto[], unknown> | undefined
	navigation: StackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}

export type DeletePlaylistProps = StackScreenProps<StackParamList, 'DeletePlaylist'>
export type DetailsProps = StackScreenProps<StackParamList, 'Details'>

export type AccountDetailsProps = StackScreenProps<StackParamList, 'Account'>
export type ServerDetailsProps = StackScreenProps<StackParamList, 'Server'>
export type PlaybackDetailsProps = StackScreenProps<StackParamList, 'Playback'>
export type LabsProps = StackScreenProps<StackParamList, 'Labs'>

export type InstantMixProps = StackScreenProps<StackParamList, 'InstantMix'>

export type useState<T> = [T, React.Dispatch<T>]
