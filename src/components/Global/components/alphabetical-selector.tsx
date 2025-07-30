import React, { useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, View as RNView } from 'react-native'
import { getToken, useTheme, View, YStack } from 'tamagui'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	runOnJS,
	withTiming,
} from 'react-native-reanimated'
import { Text } from '../helpers/text'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { trigger } from 'react-native-haptic-feedback'
import { useSettingsContext } from '../../../providers/Settings'

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
export function AZScroller({ onLetterSelect }: { onLetterSelect: (letter: string) => void }) {
	const { width, height } = useSafeAreaFrame()
	const theme = useTheme()
	const { reducedHaptics } = useSettingsContext()

	const overlayOpacity = useSharedValue(0)

	const alphabetSelectorRef = useRef<RNView>(null)

	const alphabetSelectorTopY = useRef(0)
	const letterHeight = useRef(0)
	const selectedLetter = useSharedValue('')

	const [overlayLetter, setOverlayLetter] = useState('')

	const showOverlay = () => {
		'worklet'
		overlayOpacity.value = withTiming(1)
	}

	const hideOverlay = () => {
		'worklet'
		overlayOpacity.value = withTiming(0)
	}

	const panGesture = useMemo(
		() =>
			Gesture.Pan()
				.runOnJS(true)
				.onBegin((e) => {
					trigger('impactLight')
					const relativeY = e.absoluteY - alphabetSelectorTopY.current
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

	const animatedOverlayStyle = useAnimatedStyle(() => ({
		opacity: overlayOpacity.value,
		transform: [{ scale: overlayOpacity.value }],
	}))

	const handleLetterLayout = (event: LayoutChangeEvent) => {
		letterHeight.current = event.nativeEvent.layout.height
	}

	useEffect(() => {
		if (!reducedHaptics && overlayLetter) trigger('impactLight')
	}, [overlayLetter])

	return (
		<>
			<GestureDetector gesture={panGesture}>
				<YStack
					minWidth={'$3'}
					maxWidth={'$5'}
					marginVertical={'auto'}
					width={width / 6}
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
								onPress={() => {
									trigger('impactLight')
									setOverlayLetter(letter)
									showOverlay()
									setTimeout(() => {
										onLetterSelect(letter.toLowerCase())
										hideOverlay()
									}, 200)
								}}
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
						top: getToken('$4'),
						left: getToken('$3'),
						width: getToken('$13'),
						height: getToken('$13'),
						justifyContent: 'center',
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
						marginHorizontal: 'auto',
					}}
				>
					{overlayLetter}
				</Animated.Text>
			</Animated.View>
		</>
	)
}
