import { BaseStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { NavigatorScreenParams } from '@react-navigation/native'

type HomeStackParamList = BaseStackParamList & {
	HomeScreen: undefined

	RecentArtists: {
		artistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	}
	MostPlayedArtists: {
		artistsInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	}
	RecentTracks: {
		tracksInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	}
	MostPlayedTracks: {
		tracksInfiniteQuery: UseInfiniteQueryResult<BaseItemDto[], Error>
	}
}

export default HomeStackParamList

export type RecentArtistsProps = NativeStackScreenProps<HomeStackParamList, 'RecentArtists'>
export type RecentTracksProps = NativeStackScreenProps<HomeStackParamList, 'RecentTracks'>
export type MostPlayedArtistsProps = NativeStackScreenProps<HomeStackParamList, 'MostPlayedArtists'>
export type MostPlayedTracksProps = NativeStackScreenProps<HomeStackParamList, 'MostPlayedTracks'>
