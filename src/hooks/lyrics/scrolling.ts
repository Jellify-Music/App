import { useEffect } from 'react'
import { SCROLL_RESET_DELAY } from './config'
import { useTapGesture } from 'react-native-gesture-handler'
import { UseResetScrollParams, UseLyricLineTapGestureParams } from './types'

/**
 * Hook to reset the scroll position based on the current lyric index after a delay.
 */
export const useResetScroll = ({
	currentLyricIndex,
	isUserScrolling,
}: UseResetScrollParams): void => {
	useEffect(() => {
		const timer = setTimeout(() => {
			isUserScrolling.value = false
		}, SCROLL_RESET_DELAY)

		return () => clearTimeout(timer)
	}, [currentLyricIndex])
}

export const useLyricLineTapGesture = ({ onPress, item, index }: UseLyricLineTapGestureParams) =>
	useTapGesture({
		maxDistance: 10,
		maxDuration: 500,
		runOnJS: true,
		onFinalize: (result) => {
			if (!result.canceled) {
				onPress(item.startTime, index)
			}
		},
	})
