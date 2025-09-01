import { QueryKeys } from '../enums/query-keys'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
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
import LoginStackParamList from './Login/types'

export type BaseStackParamList = {
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
export type PlaylistProps = NativeStackNavigationProp<BaseStackParamList, 'Playlist'>
export type TracksProps = NativeStackScreenProps<BaseStackParamList, 'Tracks'>
export type InstantMixProps = NativeStackScreenProps<BaseStackParamList, 'InstantMix'>

export type RootStackParamList = {
	Login: NavigatorScreenParams<LoginStackParamList>
	Tabs: NavigatorScreenParams<TabParamList>

	PlayerRoot: NavigatorScreenParams<PlayerParamList>

	Context: {
		item: BaseItemDto
		streamingMediaSourceInfo?: MediaSourceInfo
		downloadedMediaSourceInfo?: MediaSourceInfo
		navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
		navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
	}

	AddToPlaylist: {
		track: BaseItemDto
	}

	AudioSpecs: {
		item: BaseItemDto
		streamingMediaSourceInfo?: MediaSourceInfo
		downloadedMediaSourceInfo?: MediaSourceInfo
	}
}

export type LoginProps = NativeStackNavigationProp<RootStackParamList, 'Login'>
export type TabProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>
export type PlayerProps = NativeStackScreenProps<RootStackParamList, 'PlayerRoot'>
export type ContextProps = NativeStackScreenProps<RootStackParamList, 'Context'>
export type AddToPlaylistProps = NativeStackScreenProps<RootStackParamList, 'AddToPlaylist'>
export type AudioSpecsProps = NativeStackScreenProps<RootStackParamList, 'AudioSpecs'>

export type GenresProps = {
	genres: InfiniteData<BaseItemDto[], unknown> | undefined
	fetchNextPage: (options?: FetchNextPageOptions | undefined) => void
	hasNextPage: boolean
	isPending: boolean
	isFetchingNextPage: boolean
}
