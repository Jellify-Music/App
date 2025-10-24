import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { View as RNView } from 'react-native'
import { getToken, useTheme, View, YStack } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	runOnJS,
	withTiming,
	withDelay,
} from 'react-native-reanimated'
import { Text } from '../helpers/text'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { UseInfiniteQueryResult, useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import useHapticFeedback from '../../../hooks/use-haptic-feedback'

const alphabet = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
/**
 * A component that displays a list of hardcoded alphabet letters and a selected letter overlay
 * When a letter is selected, the overlay will be shown and the callback function will be called
 * with the selected letter
 *
 * The overlay will be hidden after 200ms
 *
 * @param onLetterSelect - Callback function to be called when a letter is selected
 * @returns A component that displays a list of letters and a selected letter overlay
 */
export default function AZScroller({
	onLetterSelect,
}: {
	onLetterSelect: (letter: string) => void
}) {
	const { width } = useSafeAreaFrame()
	const theme = useTheme()
	const trigger = useHapticFeedback()

	const overlayOpacity = useSharedValue(0)

	const alphabetSelectorRef = useRef<RNView>(null)

	// Shared values for use on the UI thread
	const alphabetSelectorTopY = useSharedValue(0)
	const letterHeight = useSharedValue(0)
	const selectedLetter = useSharedValue('')

	const [overlayLetter, setOverlayLetter] = useState('')

	const showOverlay = () => {
		'worklet'
		if (overlayOpacity.value !== 1) {
			overlayOpacity.value = withTiming(1)
		}
	}

	const hideOverlay = (delayMs: number = 200) => {
		'worklet'
		overlayOpacity.value = withDelay(delayMs, withTiming(0))
	}

	const getLetterFromAbsoluteY = (absoluteY: number) => {
		'worklet'
		if (letterHeight.value <= 0) return ''
		const relativeY = absoluteY - alphabetSelectorTopY.value
		const rawIndex = Math.floor(relativeY / letterHeight.value)
		const clampedIndex = Math.max(0, Math.min(alphabet.length - 1, rawIndex))
		return alphabet[clampedIndex] ?? ''
	}

	const updateSelectionFromY = (absoluteY: number) => {
		'worklet'
		const letter = getLetterFromAbsoluteY(absoluteY)
		if (letter && letter !== selectedLetter.value) {
			selectedLetter.value = letter
			runOnJS(setOverlayLetter)(letter)
			showOverlay()
		} else if (letter) {
			showOverlay()
		}
	}

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.minDistance(10)
				.hitSlop(8)
				.onBegin((e) => {
					updateSelectionFromY(e.absoluteY)
				})
				.onUpdate((e) => {
					updateSelectionFromY(e.absoluteY)
				})
				.onEnd(() => {
					hideOverlay(200)
					if (selectedLetter.value) {
						runOnJS(onLetterSelect)(selectedLetter.value.toLowerCase())
					}
				}),
		[onLetterSelect],
	)

	const tapGesture = useMemo(
		() =>
			Gesture.Tap()
				.maxDistance(10)
				.hitSlop(8)
				.onBegin((e) => {
					updateSelectionFromY(e.absoluteY)
				})
				.onEnd(() => {
					hideOverlay(200)
					if (selectedLetter.value)
						runOnJS(onLetterSelect)(selectedLetter.value.toLowerCase())
				}),
		[onLetterSelect],
	)

	// Prefer pan exclusively when movement occurs to avoid duplicate taps
	const gesture = Gesture.Exclusive(panGesture, tapGesture)

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
		transform: [{ scale: overlayOpacity.value }],
	}))

	useEffect(() => {
		// Keep haptics behavior as-is per request
		trigger('impactLight')
	}, [overlayLetter])

	return (
		<>
			<GestureDetector gesture={gesture}>
				<YStack
					minWidth={'$3'}
					maxWidth={'$5'}
					marginVertical={'auto'}
					width={width / 6}
					justifyContent='flex-start'
					alignItems='center'
					alignContent='center'
					accessible
					accessibilityRole='adjustable'
					accessibilityLabel='Alphabet scroller'
					onLayout={() => {
						requestAnimationFrame(() => {
							alphabetSelectorRef.current?.measureInWindow((x, y, w, h) => {
								alphabetSelectorTopY.value = y
								if (h && h > 0) {
									letterHeight.value = h / alphabet.length
								}
							})
						})
					}}
					ref={alphabetSelectorRef}
				>
					{alphabet.map((letter) => (
						<Text
							key={letter}
							fontSize='$6'
							textAlign='center'
							color='$neutral'
							height={'$1'}
							userSelect='none'
						>
							{letter}
						</Text>
					))}
				</YStack>
			</GestureDetector>

			<Animated.View
				pointerEvents='none'
				style={[
					{
						position: 'absolute',
						top: getToken('$4'),
						left: getToken('$3'),
						width: getToken('$13'),
						height: getToken('$13'),
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: theme.background.val,
						borderRadius: getToken('$4'),
						borderWidth: getToken('$1'),
						borderColor: theme.primary.val,
					},
					animatedOverlayStyle,
				]}
			>
				<Animated.Text
					style={{
						fontSize: getToken('$12'),
						textAlign: 'center',
						fontFamily: 'Figtree-Bold',
						color: theme.primary.val,
					}}
				>
					{overlayLetter}
				</Animated.Text>
			</Animated.View>
		</>
	)
}

export const alphabeticalSelectorCallback = async (
	letter: string,
	pageParams: RefObject<Set<string>>,
	infiniteQuery: UseInfiniteQueryResult<BaseItemDto[] | (string | number | BaseItemDto)[], Error>,
) => {
	const target = letter.toUpperCase()
	let safety = 0
	const MAX_PAGES = 100
	while (!pageParams.current.has(target) && infiniteQuery.hasNextPage && safety < MAX_PAGES) {
		console.debug(`Fetching next page for alphabet selection`)
		await infiniteQuery.fetchNextPage()
		safety += 1
	}
	if (!pageParams.current.has(target) && safety >= MAX_PAGES) {
		console.warn(
			`Alphabetical Selector: reached page fetch cap (${MAX_PAGES}) without finding ${target}`,
		)
	}
	console.debug(`Alphabetical Selector Callback: ${letter} complete`)
}

interface AlphabetSelectorMutation {
	letter: string
	pageParams: RefObject<Set<string>>
	infiniteQuery: UseInfiniteQueryResult<BaseItemDto[] | (string | number | BaseItemDto)[], Error>
}

export const useAlphabetSelector = (onSuccess: (letter: string) => void) => {
	return useMutation({
		onMutate: ({ letter }) =>
			console.debug(`Alphabet selector callback started, fetching pages for ${letter}`),
		mutationFn: ({ letter, pageParams, infiniteQuery }: AlphabetSelectorMutation) =>
			alphabeticalSelectorCallback(letter, pageParams, infiniteQuery),
		onSuccess: (data: void, { letter }: AlphabetSelectorMutation) => onSuccess(letter),
		onError: (error, { letter }) =>
			console.error(`Unable to paginate to letter ${letter}`, error),
	})
}
