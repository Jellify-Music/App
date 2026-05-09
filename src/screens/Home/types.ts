import { BaseStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

type HomeStackParamList = BaseStackParamList & {
	HomeScreen: undefined

	RecentArtists: undefined
	MostPlayedArtists: undefined
	RecentTracks: undefined
	MostPlayedTracks: undefined
}

export default HomeStackParamList

export type RecentArtistsProps = NativeStackScreenProps<HomeStackParamList, 'RecentArtists'>
export type RecentTracksProps = NativeStackScreenProps<HomeStackParamList, 'RecentTracks'>
export type MostPlayedArtistsProps = NativeStackScreenProps<HomeStackParamList, 'MostPlayedArtists'>
export type MostPlayedTracksProps = NativeStackScreenProps<HomeStackParamList, 'MostPlayedTracks'>
