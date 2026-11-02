import { ParsedLyricLine } from '../../types/Lyrics'
import { SharedValue } from 'react-native-reanimated'

export type UseResetScrollParams = {
	currentLyricIndex: number
	isUserScrolling: SharedValue<boolean>
}

export type LyricLineTapGestureHandler = (startTime: number, index: number) => void

export type UseLyricLineTapGestureParams = {
	onPress: LyricLineTapGestureHandler
	item: ParsedLyricLine
	index: number
}
