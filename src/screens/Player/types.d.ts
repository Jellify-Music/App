import { RootStackParamList } from '../types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { BaseItemDto, NameGuidPair } from '@jellyfin/sdk/lib/generated-client/models'

type PlayerParamList = {
	PlayerScreen: undefined
	QueueScreen: undefined

	MultipleArtistsSheet: {
		artists: NameGuidPair[]
	}
	LyricsScreen: {
		lyrics: LyricDto['Lyrics']
	}
}

export type PlayerProps = NativeStackScreenProps<PlayerParamList, 'PlayerScreen'>
export type MultipleArtistsProps = NativeStackScreenProps<PlayerParamList, 'MultipleArtistsSheet'>
