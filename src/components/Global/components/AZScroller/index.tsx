import React, { RefObject, useEffect, useRef, useState } from 'react'
import { LayoutChangeEvent, Text as RNText } from 'react-native'
import { getToken, Paragraph, Spinner, useTheme, View, YStack } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { applyHapticFeedback } from '../../../../utils/haptics'
import { LibrarySectionListData } from '../../types'
import { SectionListRef } from '@legendapp/list/section-list'
import { UseInfiniteQueryResult } from '@tanstack/react-query'
import { JumpToLetter, LetterJump } from '../../../../api/queries/letter-jump'
import { sectionLocationForOffset } from '../../../../api/queries/letter-jump/utils'

const alphabetAtoZ = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const alphabetZtoA = '#ZYXWVUTSRQPONMLKJIHGFEDCBA'.split('')

interface AZScrollerProps {
	sectionListRef: RefObject<SectionListRef | null>
	query: UseInfiniteQueryResult<LibrarySectionListData[], Error>

	/**
	 * Repositions the list's query onto the selected letter's section.
	 * Resolved server-side, so any letter is reachable in a couple of small
	 * requests regardless of library size or jump direction
	 */
	onJumpToLetter: JumpToLetter

	alphabet?: string[]
	reverseOrder?: boolean
}

/**
 * A component that displays a list of hardcoded alphabet letters and a selected letter overlay
 * When a letter is selected, the overlay will be shown and the list will jump to that
 * letter's section
 *
 * The overlay shows a spinner while the jump is pending and hides when it settles
 *
 * @param reverseOrder - When true, display #, Z-A (for descending sort) instead of #, A-Z
 * @returns A component that displays a list of letters and a selected letter overlay
 */
export default function AZScroller({
	sectionListRef,
	query,
	onJumpToLetter,
	alphabet: customAlphabet,
	reverseOrder,
}: AZScrollerProps) {
	const alphabetToUse = customAlphabet ?? (reverseOrder ? alphabetZtoA : alphabetAtoZ)
	const theme = useTheme()

	const [operationPending, setOperationPending] = useState<boolean>(false)

	const overlayOpacity = useSharedValue(0)

	const gesturePositionY = useSharedValue(0)

	const alphabetSelectorHeight = useRef(0)

	const selectedLetter = useRef('')

	const [overlayLetter, setOverlayLetter] = useState('')

	const pendingJumpRef = useRef<LetterJump | null>(null)
	const [jumpTick, setJumpTick] = useState(0)

	const showOverlay = () => {
		overlayOpacity.value = withSpring(1)
	}

	const hideOverlay = () => {
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
		gesturePositionY.value = withSpring(
			Math.min(Math.max(25, y - 50), alphabetSelectorHeight.current - 125),
			{
				mass: 4,
				damping: 120,
				stiffness: 1050,
			},
		)
	}

	const handleGestureBeginOrUpdate = (e: { y: number }) => {
		const height = alphabetSelectorHeight.current

		// Layout hasn't settled yet — without a height we can't map the
		// gesture to a letter
		if (height <= 0) return

		setOverlayPositionY(e.y)

		const letterHeight = height / alphabetToUse.length
		const index = Math.min(
			Math.max(Math.floor(e.y / letterHeight), 0),
			alphabetToUse.length - 1,
		)
		const letter = alphabetToUse[index]

		if (letter !== selectedLetter.current) {
			selectedLetter.current = letter
			setOverlayLetter(letter)
		}

		showOverlay()
	}

	const handleGestureEnd = () => {
		const letter = selectedLetter.current

		if (!letter) {
			hideOverlay()
			return
		}

		setOperationPending(true)
		onJumpToLetter(letter.toLowerCase())
			.then((jump) => {
				if (jump) {
					pendingJumpRef.current = jump
					setJumpTick((tick) => tick + 1)
				}
			})
			.catch((error) => {
				console.error(`Unable to jump to letter ${letter}`, error)
			})
			.finally(() => {
				setOperationPending(false)
				selectedLetter.current = ''
				hideOverlay()
			})
	}

	// Scroll once the repositioned section data has rendered
	useEffect(() => {
		const jump = pendingJumpRef.current
		const sections = query.data

		if (!jump || !sections || sections.length === 0) return

		pendingJumpRef.current = null

		const { sectionIndex, itemIndex } = sectionLocationForOffset(
			sections,
			jump.targetIndex - jump.windowStartIndex,
		)

		sectionListRef.current?.scrollToLocation({
			sectionIndex,
			itemIndex,
			viewPosition: 0,
			animated: true,
		})
	}, [jumpTick, query.data])

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

	const alphabetElements = alphabetToUse.map((letter) => (
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
		alphabetSelectorHeight.current = e.nativeEvent.layout.height
	}

	return (
		<View>
			<GestureDetector gesture={gesture}>
				<YStack minWidth={'$2'} maxWidth={'$3'} flex={1} onLayout={handleLayout}>
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
