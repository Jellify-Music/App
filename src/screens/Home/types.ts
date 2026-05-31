import { HomeNavigator, StaticParamList, StaticScreenProps } from '@react-navigation/native'
import HomeStack from '.'

export type RecentArtistsProps = StaticScreenProps<undefined>
export type RecentTracksProps = StaticScreenProps<undefined>
export type MostPlayedArtistsProps = StaticScreenProps<undefined>
export type MostPlayedTracksProps = StaticScreenProps<undefined>

type HomeStackType = typeof HomeStack

declare module '@react-navigation/core' {
	interface HomeNavigator extends HomeStackType {}
}

export type HomeStackParamList = StaticParamList<HomeNavigator>
