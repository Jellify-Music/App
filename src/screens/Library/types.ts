import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../types'
import { NavigatorScreenParams } from '@react-navigation/native'
import { FetchNextPageOptions, InfiniteData } from '@tanstack/react-query'

type LibraryStackParamList = BaseStackParamList & {
	LibraryScreen: NavigatorScreenParams<BaseStackParamList> | undefined
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

export default LibraryStackParamList

export type LibraryScreenProps = NativeStackScreenProps<LibraryStackParamList, 'LibraryScreen'>
export type LibraryArtistProps = NativeStackScreenProps<LibraryStackParamList, 'Artist'>
export type LibraryAlbumProps = NativeStackScreenProps<LibraryStackParamList, 'Album'>

export type LibraryAddPlaylistProps = NativeStackScreenProps<LibraryStackParamList, 'AddPlaylist'>
export type LibraryDeletePlaylistProps = NativeStackScreenProps<
	LibraryStackParamList,
	'DeletePlaylist'
>

export type FiltersProps = NativeStackScreenProps<LibraryStackParamList, 'Filters'>
export type SortOptionsProps = NativeStackScreenProps<LibraryStackParamList, 'SortOptions'>
export type GenreSelectionProps = NativeStackScreenProps<LibraryStackParamList, 'GenreSelection'>
export type YearSelectionProps = NativeStackScreenProps<LibraryStackParamList, 'YearSelection'>

export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
