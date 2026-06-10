import React, { RefObject, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, View as RNView, Text as RNText } from 'react-native'
import { getToken, Paragraph, Spinner, useTheme, View, YStack } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { applyHapticFeedback } from '../../../../utils/haptics'
import { LibrarySectionListData } from '../../types'
import { SectionListRef } from '@legendapp/list/section-list'
import onLetterPaginateQuery from './utils'
import { UseInfiniteQueryResult } from '@tanstack/react-query'

const alphabetAtoZ = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const alphabetZtoA = '#ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('')

interface AZScrollerProps {
	sectionListRef: RefObject<SectionListRef | null>
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>
	alphabet?: string[]
	reverseOrder?: boolean
}

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
	sectionListRef,
	query,
	alphabet: customAlphabet,
	reverseOrder,
}: AZScrollerProps) {
	const alphabetToUse = customAlphabet ?? (reverseOrder ? alphabetZtoA : alphabetAtoZ)
	const theme = useTheme()

	const [operationPending, setOperationPending] = useState<boolean>(false)

	const overlayOpacity = useSharedValue(0)

	const gesturePositionY = useSharedValue(0)

	const alphabetSelectorRef = useRef<RNView>(null)

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

	/**
	 * Sets the position of the overlay based on the y coordinate of the gesture
	 *
	 * The overlay will be positioned so that the center of the overlay is at the y coordinate of the gesture
	 * The y coordinate is clamped to the bounds of the alphabet selector to prevent the overlay from colliding
	 * with the top or bottom of the display
	 *
	 * @param y The relative y coordinate of the event
	 */
	const setOverlayPositionY = (y: number) => {
		'worklet'
		gesturePositionY.value = withSpring(
			Math.min(Math.max(25, y - 50), alphabetSelectorHeight.current - 125),
			{
				mass: 4,
				damping: 120,
				stiffness: 1050,
			},
		)
	}

	const onLetterSelect = async (letter: string) => {
		await onLetterPaginateQuery(letter, query)
	}

	const scrollToLetter = (selectedLetter: string) => {
		if (query.data) {
			const upperLetters = query.data
				.map((section) => section.title)
				.map((letter) => letter.toUpperCase())
				.sort()

			const index = upperLetters.findIndex((letter) => letter >= selectedLetter)

			if (index !== -1) {
				sectionListRef.current?.scrollToLocation({
					sectionIndex: index,
					itemIndex: 0,
					viewPosition: 0.1,
					animated: true,
				})
			}

			// else {
			// 	// fallback: scroll to last section
			// 	const lastLetter = upperLetters[upperLetters.length - 1]
			// 	const scrollIndex = artists.indexOf(lastLetter)
			// 	if (scrollIndex !== -1) {
			// 		sectionListRef.current?.scrollToIndex({
			// 			index: scrollIndex,
			// 			viewPosition: 0.1,
			// 			animated: true,
			// 		})
			// 	}
			// }
		}
	}

	const handleGestureBeginOrUpdate = (e: { y: number }) => {
		const relativeY = e.y
		setOverlayPositionY(relativeY)
		const index = Math.floor(relativeY / letterHeight.current)
		if (alphabetToUse[index]) {
			const letter = alphabetToUse[index]
			selectedLetter.value = letter
			setOverlayLetter(letter)
			scheduleOnRN(showOverlay)
		}
	}

	const handleGestureEnd = () => {
		if (selectedLetter.value) {
			scheduleOnRN(async () => {
				setOperationPending(true)
				onLetterSelect(selectedLetter.value.toLowerCase()).then(() => {
					scheduleOnRN(hideOverlay)
					setOperationPending(false)
					scrollToLetter(selectedLetter.value)
				})
			})
		} else {
			scheduleOnRN(hideOverlay)
		}
	}

	const panGesture = Gesture.Pan()
		.runOnJS(true)
		.onBegin(handleGestureBeginOrUpdate)
		.onUpdate(handleGestureBeginOrUpdate)
		.onEnd(handleGestureEnd)

	const tapGesture = Gesture.Tap()
		.runOnJS(true)
		.onBegin(handleGestureBeginOrUpdate)
		.onEnd(handleGestureEnd)

	const gesture = Gesture.Simultaneous(panGesture, tapGesture)

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
		transform: [{ scale: overlayOpacity.value }],
		top: gesturePositionY.value,
	}))

	const alphabetElements = alphabetToUse.map((letter, index) => (
		<Paragraph
			flex={1}
			key={letter}
			userSelect='none'
			color={'$borderColor'}
			fontSize={'$6'}
			fontWeight={'$6'}
			textAlign='center'
		>
			{letter}
		</Paragraph>
	))

	useEffect(() => {
		if (overlayLetter !== '') {
			applyHapticFeedback('info')
		}
	}, [overlayLetter])

	const handleLayout = (e: LayoutChangeEvent) => {
		const { height } = e.nativeEvent.layout
		alphabetSelectorHeight.current = height
		letterHeight.current = height / alphabetToUse.length
	}

	return (
		<View>
			<GestureDetector gesture={gesture}>
				<YStack
					minWidth={'$2'}
					maxWidth={'$3'}
					flex={1}
					ref={alphabetSelectorRef}
					onLayout={handleLayout}
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
		</View>
	)
}
