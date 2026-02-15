import React, { RefObject, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, View as RNView, Text as RNText } from 'react-native'
import { getToken, Spinner, Text, useTheme, YStack } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { UseInfiniteQueryResult, useMutation } from '@tanstack/react-query'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { triggerHaptic } from '../../../hooks/use-haptic-feedback'

const alphabetAtoZ = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const alphabetZtoA = '#ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('')
/**
 * A component that displays a list of hardcoded alphabet letters and a selected letter overlay
 * When a letter is selected, the overlay will be shown and the callback function will be called
 * with the selected letter
 *
 * The overlay will be hidden after 200ms
 *
 * @param onLetterSelect - Callback function to be called when a letter is selected
 * @param reverseOrder - When true, display #, Z-A (for descending sort) instead of #, A-Z
 * @returns A component that displays a list of letters and a selected letter overlay
 */
export default function AZScroller({
	onLetterSelect,
	alphabet: customAlphabet,
	reverseOrder,
}: {
	onLetterSelect: (letter: string) => Promise<void>
	alphabet?: string[]
	reverseOrder?: boolean
}) {
	const alphabetToUse = customAlphabet ?? (reverseOrder ? alphabetZtoA : alphabetAtoZ)
	const theme = useTheme()

	const [operationPending, setOperationPending] = useState<boolean>(false)

	const overlayOpacity = useSharedValue(0)

	const gesturePositionY = useSharedValue(0)

	const alphabetSelectorRef = useRef<RNView>(null)

	const alphabetSelectorTopY = useRef(0)
	const alphabetSelectorHeight = useRef(0)

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
		gesturePositionY.value = withSpring(
			Math.min(Math.max(25, y - 50), alphabetSelectorHeight.current - 125),
			{
				mass: 4,
				damping: 120,
				stiffness: 1050,
			},
		)
	}

	const panGesture = Gesture.Pan()
		.runOnJS(true)
		.onBegin((e) => {
			const relativeY = e.absoluteY - alphabetSelectorTopY.current
			setOverlayPositionY(relativeY)
			const index = Math.floor(relativeY / letterHeight.current)
			if (alphabetToUse[index]) {
				const letter = alphabetToUse[index]
				selectedLetter.value = letter
				setOverlayLetter(letter)
				scheduleOnRN(showOverlay)
			}
		})
		.onUpdate((e) => {
			const relativeY = e.absoluteY - alphabetSelectorTopY.current
			setOverlayPositionY(relativeY)
			const index = Math.floor(relativeY / letterHeight.current)
			if (alphabetToUse[index]) {
				const letter = alphabetToUse[index]
				selectedLetter.value = letter
				setOverlayLetter(letter)
				scheduleOnRN(showOverlay)
			}
		})
		.onEnd(() => {
			if (selectedLetter.value) {
				scheduleOnRN(async () => {
					setOperationPending(true)
					onLetterSelect(selectedLetter.value.toLowerCase()).then(() => {
						scheduleOnRN(hideOverlay)
						setOperationPending(false)
					})
				})
			} else {
				scheduleOnRN(hideOverlay)
			}
		})

	const tapGesture = Gesture.Tap()
		.runOnJS(true)
		.onBegin((e) => {
			const relativeY = e.absoluteY - alphabetSelectorTopY.current
			setOverlayPositionY(relativeY)
			const index = Math.floor(relativeY / letterHeight.current)
			if (alphabetToUse[index]) {
				const letter = alphabetToUse[index]
				selectedLetter.value = letter
				setOverlayLetter(letter)
				scheduleOnRN(showOverlay)
			}
		})
		.onEnd(() => {
			if (selectedLetter.value) {
				scheduleOnRN(async () => {
					setOperationPending(true)
					onLetterSelect(selectedLetter.value.toLowerCase()).then(() => {
						scheduleOnRN(hideOverlay)
						setOperationPending(false)
					})
				})
			} else {
				scheduleOnRN(hideOverlay)
			}
		})

	const gesture = Gesture.Simultaneous(panGesture, tapGesture)

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
		transform: [{ scale: overlayOpacity.value }],
		top: gesturePositionY.value,
	}))

	const handleLetterLayout = (event: LayoutChangeEvent) => {
		letterHeight.current = event.nativeEvent.layout.height
	}

	const alphabetElements = alphabetToUse.map((letter, index) => {
		const letterElement = (
			<Text key={letter} userSelect='none' color={'$borderColor'} fontSize={17.5}>
				{letter}
			</Text>
		)

		return index === 0 ? (
			<Text
				key={letter}
				color={'$borderColor'}
				userSelect='none'
				fontSize={17.5}
				onLayout={handleLetterLayout}
			>
				{letterElement}
			</Text>
		) : (
			letterElement
		)
	})

	useEffect(() => {
		triggerHaptic('impactLight')
	}, [overlayLetter])

	return (
		<>
			<GestureDetector gesture={gesture}>
				<YStack
					minWidth={'$2'}
					maxWidth={'$3'}
					justifyContent='flex-start'
					alignItems='center'
					alignContent='center'
					paddingVertical={0}
					paddingHorizontal={0}
					onLayout={(event) => {
						requestAnimationFrame(() => {
							alphabetSelectorRef.current?.measureInWindow((x, y, width, height) => {
								alphabetSelectorTopY.current = y
								alphabetSelectorHeight.current = height
							})
						})
					}}
					ref={alphabetSelectorRef}
				>
					{alphabetElements}
				</YStack>
			</GestureDetector>

			<Animated.View
				pointerEvents='none'
				style={[
					{
						position: 'absolute',
						right: getToken('$12'),
						width: 100,
						height: 100,
						justifyContent: 'center',
						backgroundColor: theme.primary.val,
						borderRadius: getToken('$4'),
					},
					animatedOverlayStyle,
				]}
			>
				{operationPending ? (
					<Spinner
						size='large'
						color={theme.background.val}
						alignSelf='center'
						justify={'center'}
					/>
				) : (
					<RNText
						style={{
							fontSize: getToken('$12'),
							textAlign: 'center',
							fontFamily: 'Figtree-Bold',
							color: theme.background.val,
							marginHorizontal: 'auto',
						}}
					>
						{overlayLetter}
					</RNText>
				)}
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
		await fetchNextPage()
	}
}

interface AlphabetSelectorMutation {
	letter: string
	pageParams: RefObject<Set<string>>
	infiniteQuery: UseInfiniteQueryResult<BaseItemDto[] | (string | number | BaseItemDto)[], Error>
}

export const useAlphabetSelector = (onSuccess: (letter: string) => void) => {
	return useMutation({
		onMutate: ({ letter }) => {},
		mutationFn: ({ letter, pageParams, infiniteQuery }: AlphabetSelectorMutation) =>
			alphabeticalSelectorCallback(letter, pageParams, infiniteQuery),
		onSuccess: (data: void, { letter }: AlphabetSelectorMutation) => onSuccess(letter),
		onError: (error, { letter }) =>
			console.error(`Unable to paginate to letter ${letter}`, error),
	})
}
