import { StaticParamList, StaticScreenProps } from '@react-navigation/native'
import type HomeStack from '.'

export type RecentArtistsProps = StaticScreenProps<undefined>
export type RecentTracksProps = StaticScreenProps<undefined>
export type MostPlayedArtistsProps = StaticScreenProps<undefined>
export type MostPlayedTracksProps = StaticScreenProps<undefined>

export type HomeStackNavigator = typeof HomeStack

type HomeStackParamList = StaticParamList<HomeStackNavigator>

export default HomeStackParamList
