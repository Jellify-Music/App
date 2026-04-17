import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useEffect, useRef } from 'react'
import Icon from './icon'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useIsDownloaded } from '../../../hooks/downloads'
import { useDownloadProgress } from 'react-native-nitro-player'
import CircularProgressIndicator from './circular-progress-indicator'

function DownloadedIcon({
	item,
	size = 'small',
}: {
	item: BaseItemDto
	size?: 'xxxsmall' | 'xxsmall' | 'xsmall' | 'small' | 'medium' | 'large'
}) {
	const itemId = item.Id
	const isDownloaded = useIsDownloaded(itemId)
	const trackIdsRef = useRef<string[]>([])

	if (itemId) {
		if (trackIdsRef.current.length !== 1 || trackIdsRef.current[0] !== itemId) {
			trackIdsRef.current = [itemId]
		}
	} else if (trackIdsRef.current.length > 0) {
		trackIdsRef.current = []
	}

	const { overallProgress, isDownloading } = useDownloadProgress({
		trackIds: trackIdsRef.current,
		activeOnly: true,
	})

	const isVisible = isDownloaded || isDownloading

	/**
	 * Skip the entrance fade on the first render where the icon becomes
	 * visible — that's almost always the moment a list of already-downloaded
	 * rows reveals all their badges at once when the downloads query resolves,
	 * and we don't want N simultaneous Reanimated worklets to fire. Subsequent
	 * visibility transitions (e.g. a row whose download finishes while it's
	 * already on-screen, or the icon swapping between progress and downloaded)
	 * still animate normally.
	 *
	 * Tracking *visibility* rather than *mount* matters in the cold-cache case:
	 * the component first mounts while the downloads query is still pending
	 * (so it returns nothing), and only later renders the visible variant when
	 * the query resolves. A mount-based ref would be flipped to "not first" by
	 * an effect that ran during the empty render, so the first visible render
	 * would still animate.
	 */
	const hasRenderedVisible = useRef(false)
	const skipEntrance = !hasRenderedVisible.current
	useEffect(() => {
		if (isVisible) hasRenderedVisible.current = true
	}, [isVisible])

	if (!isVisible) return null

	const fadeIn = FadeIn.easing(Easing.in(Easing.ease))

	return isDownloaded ? (
		<Animated.View
			entering={skipEntrance ? undefined : fadeIn}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
		>
			<Icon {...{ [size]: true }} name='download-circle' color={'$success'} flex={1} />
		</Animated.View>
	) : (
		<Animated.View
			entering={skipEntrance ? undefined : fadeIn}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
		>
			<CircularProgressIndicator progress={overallProgress} size={12} strokeWidth={4} />
		</Animated.View>
	)
}

export default DownloadedIcon
