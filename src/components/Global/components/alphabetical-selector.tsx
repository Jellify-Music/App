import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, View as RNView } from 'react-native'
import { getToken, useTheme, View, YStack } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
	withSpring,
} from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
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

	const gesturePositionY = useSharedValue(0)

	const alphabetSelectorRef = useRef<RNView>(null)

	const alphabetSelectorTopY = useRef(0)
	const letterHeight = useRef(0)
	const selectedLetter = useSharedValue('')

	const [overlayLetter, setOverlayLetter] = useState('')

	const showOverlay = () => {
		'worklet'
		overlayOpacity.value = withSpring(1)
	}

	const hideOverlay = () => {
		'worklet'
		overlayOpacity.value = withSpring(0)
	}

	const setOverlayPositionY = (y: number) => {
		'worket'
		gesturePositionY.value = withSpring(y, {
			mass: 4,
			damping: 120,
			stiffness: 1050,
		})
	}

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.runOnJS(true)
				.onBegin((e) => {
					const relativeY = e.absoluteY - alphabetSelectorTopY.current
					setOverlayPositionY(relativeY - letterHeight.current * 1.5)
					const index = Math.floor(relativeY / letterHeight.current)
					if (alphabet[index]) {
						const letter = alphabet[index]
						selectedLetter.value = letter
						setOverlayLetter(letter)
						runOnJS(showOverlay)()
					}
				})
				.onUpdate((e) => {
					const relativeY = e.absoluteY - alphabetSelectorTopY.current
					setOverlayPositionY(relativeY - letterHeight.current * 1.5)
					const index = Math.floor(relativeY / letterHeight.current)
					if (alphabet[index]) {
						const letter = alphabet[index]
						selectedLetter.value = letter
						setOverlayLetter(letter)
						runOnJS(showOverlay)()
					}
				})
				.onEnd(() => {
					runOnJS(hideOverlay)()
					if (selectedLetter.value) {
						runOnJS(onLetterSelect)(selectedLetter.value.toLowerCase())
					}
				}),
		[onLetterSelect],
	)

	const tapGesture = useMemo(
		() =>
			Gesture.Tap()
				.runOnJS(true)
				.onBegin((e) => {
					const relativeY = e.absoluteY - alphabetSelectorTopY.current
					setOverlayPositionY(relativeY - letterHeight.current * 1.5)
					const index = Math.floor(relativeY / letterHeight.current)
					if (alphabet[index]) {
						const letter = alphabet[index]
						selectedLetter.value = letter
						setOverlayLetter(letter)
						runOnJS(showOverlay)()
					}
				})
				.onEnd(() => {
					runOnJS(hideOverlay)()
					if (selectedLetter.value)
						runOnJS(onLetterSelect)(selectedLetter.value.toLowerCase())
				}),
		[onLetterSelect],
	)

	const gesture = Gesture.Simultaneous(panGesture, tapGesture)

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
		transform: [{ scale: overlayOpacity.value }],
		top: gesturePositionY.get(),
	}))

	const handleLetterLayout = (event: LayoutChangeEvent) => {
		letterHeight.current = event.nativeEvent.layout.height
	}

	useEffect(() => {
		trigger('impactLight')
	}, [overlayLetter])

	return (
		<>
			<GestureDetector gesture={gesture}>
				<YStack
					minWidth={'$2'}
					maxWidth={'$3'}
					marginVertical={'auto'}
					justifyContent='flex-start'
					alignItems='center'
					alignContent='center'
					onLayout={() => {
						requestAnimationFrame(() => {
							alphabetSelectorRef.current?.measureInWindow((x, y, width, height) => {
								alphabetSelectorTopY.current = y
							})
						})
					}}
					ref={alphabetSelectorRef}
				>
					{alphabet.map((letter, index) => {
						const letterElement = (
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
						)

						return index === 0 ? (
							<View height={'$1'} key={letter} onLayout={handleLetterLayout}>
								{letterElement}
							</View>
						) : (
							letterElement
						)
					})}
				</YStack>
			</GestureDetector>

			<Animated.View
				pointerEvents='none'
				style={[
					{
						position: 'absolute',
						right: getToken('$12'),
						width: getToken('$13'),
						height: getToken('$13'),
						justifyContent: 'center',
						backgroundColor: theme.primary.val,
						borderRadius: getToken('$4'),
					},
					animatedOverlayStyle,
				]}
			>
				<Animated.Text
					style={{
						fontSize: getToken('$12'),
						textAlign: 'center',
						fontFamily: 'Figtree-Bold',
						color: theme.background.val,
						marginHorizontal: 'auto',
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
	{
		hasNextPage,
		fetchNextPage,
		isPending,
	}: UseInfiniteQueryResult<BaseItemDto[] | (string | number | BaseItemDto)[], Error>,
) => {
	while (!pageParams.current.has(letter.toUpperCase()) && hasNextPage) {
		console.debug(`Fetching next page for alphabet selection`)
		await fetchNextPage()
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
