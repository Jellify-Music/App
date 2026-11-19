import { NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models'
import { StaticParamList, StaticScreenProps } from '@react-navigation/native'
import type PlayerStack from '.'

export type PlayerStackNavigator = typeof PlayerStack

export type PlayerParamList = StaticParamList<PlayerStackNavigator>

export type MultipleArtistsProps = StaticScreenProps<{
	artists: NameGuidPair[]
}>
