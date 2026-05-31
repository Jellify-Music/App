import { QueryKeys } from '../enums/query-keys'
import { BaseItemDto, MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'
import { Queue } from '../services/types/queue-item'
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
import { NavigatorScreenParams, StaticParamList, StaticScreenProps } from '@react-navigation/native'
import TabParamList from './Tabs/types'
import { PlayerParamList } from './Player/types'
import LoginStackParamList from './Login/types'

type BaseStackParamList = {
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
	}

	Tracks: {
		tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
	}
}

export type StaticBaseStackParamList = StaticParamList<BaseStackParamList>

export type StackNavigation = Pick<
	NativeStackNavigationProp<BaseStackParamList>,
	'navigate' | 'dispatch'
>

export type ArtistProps = StaticScreenProps<{
	artist: BaseItemDto
}>
export type AlbumProps = StaticScreenProps<{
	album: BaseItemDto
}>
export type PlaylistProps = StaticScreenProps<{
	playlist: BaseItemDto
	canEdit?: boolean | undefined
}>
export type TracksProps = StaticScreenProps<{
	tracksInfiniteQuery: UseInfiniteQueryResult<(string | number | BaseItemDto)[], Error>
}>
export type InstantMixProps = StaticScreenProps<{
	item: BaseItemDto
}>

export type RootStackParamList = {
	Login: NavigatorScreenParams<LoginStackParamList>
	Tabs: NavigatorScreenParams<TabParamList> | undefined

	PlayerRoot: NavigatorScreenParams<PlayerParamList>

	Context: {
		item: BaseItemDto
		playlist?: BaseItemDto
		streamingMediaSourceInfo?: MediaSourceInfo
		downloadedMediaSourceInfo?: MediaSourceInfo
		navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
		navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
	}

	AddToPlaylist: {
		tracks: BaseItemDto[]
		source?: BaseItemDto
	}

	AudioSpecs: {
		item: BaseItemDto
		streamingMediaSourceInfo?: MediaSourceInfo
		downloadedMediaSourceInfo?: MediaSourceInfo
	}

	DeletePlaylist: {
		playlist: BaseItemDto
		onDelete: () => void
	}

	MigrateDownloads: undefined
}

export type LoginProps = NativeStackNavigationProp<RootStackParamList, 'Login'>
export type TabProps = NativeStackScreenProps<RootStackParamList, 'Tabs'>

export type ContextProps = StaticScreenProps<{
	item: BaseItemDto
	playlist?: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
	navigation?: Pick<NativeStackNavigationProp<BaseStackParamList>, 'navigate' | 'dispatch'>
	navigationCallback?: (screen: 'Album' | 'Artist', item: BaseItemDto) => void
}>

export type AddToPlaylistProps = StaticScreenProps<{
	tracks: BaseItemDto[]
	source?: BaseItemDto
}>

export type AudioSpecsProps = StaticScreenProps<{
	item: BaseItemDto
	streamingMediaSourceInfo?: MediaSourceInfo
	downloadedMediaSourceInfo?: MediaSourceInfo
}>
