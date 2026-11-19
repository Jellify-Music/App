import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { StaticParamList, StaticScreenProps } from '@react-navigation/native'
import { FetchNextPageOptions, InfiniteData } from '@tanstack/react-query'
import type LibraryStack from '.'

export type LibraryStackNavigator = typeof LibraryStack

type LibraryStackParamList = StaticParamList<LibraryStackNavigator>

export default LibraryStackParamList

export type LibraryDeletePlaylistProps = StaticScreenProps<{
	playlist: BaseItemDto
}>

export type FiltersProps = StaticScreenProps<{
	currentTab?: 'Tracks' | 'Albums' | 'Artists'
}>
export type SortOptionsProps = StaticScreenProps<{
	currentTab?: 'Tracks' | 'Albums' | 'Artists'
}>
export type YearSelectionProps = StaticScreenProps<{ tab?: 'Tracks' | 'Albums' }>

export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
