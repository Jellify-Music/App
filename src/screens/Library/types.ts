import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../types'
import { NavigatorScreenParams } from '@react-navigation/native'
import { FetchNextPageOptions, InfiniteData } from '@tanstack/react-query'

export type LibraryStackParamList = {
	LibraryArtists: undefined
	LibraryAlbums: undefined
	LibraryTracks: undefined
	Playlists: undefined
}

export type LibraryParamList = BaseStackParamList &
	LibraryStackParamList & {
		LibraryScreen: NavigatorScreenParams<LibraryStackParamList> | undefined
		AddPlaylist: undefined
		DeletePlaylist: {
			playlist: BaseItemDto
		}
		Filters: {
			currentTab?: 'Tracks' | 'Albums' | 'Artists'
		}

		SortOptions: {
			currentTab?: 'Tracks' | 'Albums' | 'Artists'
		}

		GenreSelection: undefined
		YearSelection: { tab?: 'Tracks' | 'Albums' }
	}

export type LibraryScreenProps = NativeStackScreenProps<LibraryParamList, 'LibraryScreen'>
export type LibraryArtistProps = NativeStackScreenProps<LibraryParamList, 'Artist'>
export type LibraryAlbumProps = NativeStackScreenProps<LibraryParamList, 'Album'>

export type LibraryAddPlaylistProps = NativeStackScreenProps<LibraryParamList, 'AddPlaylist'>
export type LibraryDeletePlaylistProps = NativeStackScreenProps<LibraryParamList, 'DeletePlaylist'>

export type FiltersProps = NativeStackScreenProps<LibraryParamList, 'Filters'>
export type SortOptionsProps = NativeStackScreenProps<LibraryParamList, 'SortOptions'>
export type GenreSelectionProps = NativeStackScreenProps<LibraryParamList, 'GenreSelection'>
export type YearSelectionProps = NativeStackScreenProps<LibraryParamList, 'YearSelection'>

export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
