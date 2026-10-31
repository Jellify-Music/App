import { useEffect } from 'react'
import { SharedValue } from 'react-native-reanimated'
import { SCROLL_RESET_DELAY } from './config'

interface UseResetScrollProps {
	currentLyricIndex: number
	isUserScrolling: SharedValue<boolean>
}

/**
 * Hook to reset the scroll position based on the current lyric index after a delay.
 */
export const useResetScroll = ({
	currentLyricIndex,
	isUserScrolling,
}: UseResetScrollProps): void => {
	useEffect(() => {
		const timer = setTimeout(() => {
			isUserScrolling.value = false
		}, SCROLL_RESET_DELAY)

		return () => clearTimeout(timer)
	}, [currentLyricIndex])
}
