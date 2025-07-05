import { QueryKeys } from '../enums/query-keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
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
		navigation: NativeStackNavigationProp<StackParamList>
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
		navigation: NativeStackNavigationProp<StackParamList>
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

export type LoginProps = NativeStackScreenProps<StackParamList, 'Login'>
export type ServerAddressProps = NativeStackScreenProps<StackParamList, 'ServerAddress'>
export type ServerAuthenticationProps = NativeStackScreenProps<
	StackParamList,
	'ServerAuthentication'
>
export type LibrarySelectionProps = NativeStackScreenProps<StackParamList, 'LibrarySelection'>

export type TabProps = NativeStackScreenProps<StackParamList, 'Tabs'>
export type PlayerProps = NativeStackScreenProps<StackParamList, 'Player'>

export type ProvidedHomeProps = NativeStackScreenProps<StackParamList, 'HomeScreen'>
export type AddPlaylistProps = NativeStackScreenProps<StackParamList, 'AddPlaylist'>
export type RecentArtistsProps = NativeStackScreenProps<StackParamList, 'RecentArtists'>
export type RecentTracksProps = NativeStackScreenProps<StackParamList, 'RecentTracks'>
export type MostPlayedArtistsProps = NativeStackScreenProps<StackParamList, 'MostPlayedArtists'>
export type MostPlayedTracksProps = NativeStackScreenProps<StackParamList, 'MostPlayedTracks'>
export type UserPlaylistsProps = NativeStackScreenProps<StackParamList, 'UserPlaylists'>

export type DiscoverProps = NativeStackScreenProps<StackParamList, 'Discover'>
export type RecentlyAddedProps = NativeStackScreenProps<StackParamList, 'RecentlyAdded'>
export type HomeArtistProps = NativeStackScreenProps<StackParamList, 'Artist'>
export type ArtistAlbumsProps = NativeStackScreenProps<StackParamList, 'ArtistAlbums'>
export type ArtistEpsProps = NativeStackScreenProps<StackParamList, 'ArtistEps'>
export type ArtistFeaturedOnProps = NativeStackScreenProps<StackParamList, 'ArtistFeaturedOn'>

export type HomeAlbumProps = NativeStackScreenProps<StackParamList, 'Album'>

export type HomePlaylistProps = NativeStackScreenProps<StackParamList, 'Playlist'>

export type QueueProps = NativeStackScreenProps<StackParamList, 'Queue'>

export type LibraryProps = NativeStackScreenProps<StackParamList, 'LibraryScreen'>
export type TracksProps = NativeStackScreenProps<StackParamList, 'Tracks'>

export type ArtistsProps = {
	artists: (string | number | BaseItemDto)[] | undefined
	navigation: NativeStackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
	showAlphabeticalSelector: boolean
}
export type AlbumsProps = {
	albums: (string | number | BaseItemDto)[] | undefined
	navigation: NativeStackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
	showAlphabeticalSelector: boolean
}
export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	navigation: NativeStackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
export type PlaylistsProps = {
	playlists: InfiniteData<BaseItemDto[], unknown> | undefined
	navigation: NativeStackNavigationProp<StackParamList>
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}

export type DeletePlaylistProps = NativeStackScreenProps<StackParamList, 'DeletePlaylist'>
export type DetailsProps = NativeStackScreenProps<StackParamList, 'Details'>

export type AccountDetailsProps = NativeStackScreenProps<StackParamList, 'Account'>
export type ServerDetailsProps = NativeStackScreenProps<StackParamList, 'Server'>
export type PlaybackDetailsProps = NativeStackScreenProps<StackParamList, 'Playback'>
export type LabsProps = NativeStackScreenProps<StackParamList, 'Labs'>

export type InstantMixProps = NativeStackScreenProps<StackParamList, 'InstantMix'>

export type useState<T> = [T, React.Dispatch<T>]
