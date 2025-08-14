import { QueryKeys } from '../enums/query-keys'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { Queue } from '../player/types/queue-item'
import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import {
	InfiniteData,
	InfiniteQueryObserverResult,
	UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { RefObject } from 'react'
import HomeStackParamList from './Home/types'
import LibraryStackParamList from './Library/types'
import DiscoverStackParamList from './Discover/types'
import { NavigatorScreenParams } from '@react-navigation/native'
import TabParamList from './Tabs/types'
import { PlayerParamList } from './Player/types'

export type BaseStackParamList = {
	Home: undefined
	Library: undefined
	Search: undefined
	Discover: undefined
	Settings: undefined

	Artist: {
		artist: BaseItemDto
	}

	Album: {
		album: BaseItemDto
	}

	Playlist: {
		playlist: BaseItemDto
		canEdit?: boolean | undefined
	}

	InstantMix: {
		item: BaseItemDto
		mix: BaseItemDto[]
	}

	Tracks: {
		tracks: BaseItemDto[] | undefined
		queue: Queue
		fetchNextPage: () => void
		hasNextPage: boolean
		isPending: boolean
	}
}

export type ArtistProps = NativeStackScreenProps<BaseStackParamList, 'Artist'>
export type AlbumProps = NativeStackScreenProps<BaseStackParamList, 'Album'>
export type TracksProps = NativeStackScreenProps<BaseStackParamList, 'Tracks'>
export type InstantMixProps = NativeStackScreenProps<BaseStackParamList, 'InstantMix'>

export type RootStackParamList = {
	Login: undefined
	Tabs: NavigatorScreenParams<TabParamList>

	Player: NavigatorScreenParams<PlayerParamList>

	Context: {
		item: BaseItemDto
		isNested?: boolean | undefined
		navigation?: NativeStackNavigationProp<
			HomeStackParamList | LibraryStackParamList | DiscoverStackParamList
		>
	}
}

export type LoginProps = NativeStackNavigationProp<RootStackParamList, 'Login'>
export type TabProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>
export type PlayerProps = NativeStackScreenProps<RootStackParamList, 'Player'>
export type ContextProps = NativeStackScreenProps<RootStackParamList, 'Context'>

export type ArtistsProps = {
	artistsInfiniteQuery: UseInfiniteQueryResult<
		BaseItemDto[] | (string | number | BaseItemDto)[],
		Error
	>
	showAlphabeticalSelector: boolean
	artistPageParams?: RefObject<Set<string>>
}

export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
