import React, { RefObject, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, Text as RNText } from 'react-native'
import { getToken, Paragraph, Spinner, TamaguiElement, useTheme, View, YStack } from 'tamagui'
import {
	GestureDetector,
	usePanGesture,
	useSimultaneousGestures,
	useTapGesture,
} from 'react-native-gesture-handler'
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
	const operationPendingRef = useRef(false)

	const overlayOpacity = useSharedValue(0)

	const gesturePositionY = useSharedValue(0)

	const alphabetSelectorRef = useRef<TamaguiElement>(null)

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

	const scrollToLetter = (
		sections: LibrarySectionListData[] | undefined,
		selectedLetter: string,
	) => {
		if (!sections || sections.length === 0) return

		// Sections are already in list order, so find the first one at or past the letter
		const index = sections.findIndex((section) => {
			const title = section.title.toUpperCase()
			if (title === selectedLetter) return true
			if (selectedLetter === '#') return true
			if (title === '#') return false
			return reverseOrder ? title < selectedLetter : title > selectedLetter
		})

		sectionListRef.current?.scrollToLocation({
			sectionIndex: index === -1 ? sections.length - 1 : index,
			itemIndex: 0,
			viewPosition: 0.1,
			animated: true,
		})
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
		const letter = selectedLetter.value
		if (!letter || operationPendingRef.current) {
			scheduleOnRN(hideOverlay)
			return
		}

		operationPendingRef.current = true
		setOperationPending(true)

		onLetterPaginateQuery(letter, query, !!reverseOrder)
			.then((sections) => scrollToLetter(sections, letter))
			.catch((error) => console.warn('AZScroller: failed to paginate to letter', error))
			.finally(() => {
				operationPendingRef.current = false
				setOperationPending(false)
				scheduleOnRN(hideOverlay)
			})
	}

	const panGesture = usePanGesture({
		runOnJS: true,
		onBegin: handleGestureBeginOrUpdate,
		onUpdate: handleGestureBeginOrUpdate,
		onDeactivate: handleGestureEnd,
	})

	const tapGesture = useTapGesture({
		runOnJS: true,
		onBegin: handleGestureBeginOrUpdate,
		onDeactivate: handleGestureEnd,
	})

	const gesture = useSimultaneousGestures(panGesture, tapGesture)

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
		transform: [{ scale: overlayOpacity.value }],
		top: gesturePositionY.value,
	}))

	const alphabetElements = alphabetToUse.map((letter, index) => (
		<Paragraph
			flex={1}
			userSelect='none'
			color='borderColor'
			fontSize='3'
			fontWeight='6'
			textAlign='center'
			key={letter}
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
					minWidth='2'
					maxWidth='3'
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
						right: getToken('12'),
						width: 100,
						height: 100,
						justifyContent: 'center',
						backgroundColor: theme.primary.val,
						borderRadius: getToken('4'),
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
							fontSize: getToken('12'),
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
