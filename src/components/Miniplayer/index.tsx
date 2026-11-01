import React from 'react'
import { useTheme, XStack, YStack, SizableText } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { Ticker } from '../../components/Global/helpers/Animated/text'
import { PlayPauseIcon } from '../Player/components/buttons'

import { GestureDetector, usePanGesture } from 'react-native-gesture-handler'
import Animated, { Easing, FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'
import { RootStackParamList } from '../../screens/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemImage from '../Global/components/image'
import { useCurrentTrack } from '../../stores/player/queue'
import getTrackDto, { getTypedExtraPayload } from '../../utils/mapping/track-extra-payload'
import { ICON_PRESS_STYLES } from '../../configs/styling/elements'
import { previous, skip } from '../../player/controls'
import { PAN_GESTURE_THRESHOLD } from '../../configs/gesturing/miniplayer'
import MiniPlayerProgress from './progress'

export default function Miniplayer(): React.JSX.Element | null {
	const nowPlaying = useCurrentTrack()
	const item = getTrackDto(nowPlaying)
	const payload = getTypedExtraPayload(nowPlaying)

	const theme = useTheme()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const handleSwipe = (direction: string) => {
		if (direction === 'Swiped Left') {
			// Inverted: Swipe left -> next
			skip(undefined)
		} else if (direction === 'Swiped Right') {
			// Inverted: Swipe right -> previous
			previous()
		} else if (direction === 'Swiped Up') {
			// Navigate to the big player
			navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
		}
	}

	const gesture = usePanGesture({
		onDeactivate: (event) => {
			if (event.translationX > PAN_GESTURE_THRESHOLD) runOnJS(handleSwipe)('Swiped Right')
			else if (event.translationX < -PAN_GESTURE_THRESHOLD)
				runOnJS(handleSwipe)('Swiped Left')
			else if (event.translationY < -PAN_GESTURE_THRESHOLD) runOnJS(handleSwipe)('Swiped Up')
		},
	})

	const openPlayer = () => {
		navigation.navigate('PlayerRoot', { screen: 'PlayerScreen' })
	}

	if (!nowPlaying) return null

	// Guard: during track transitions nowPlaying can be briefly null
	if (!item) {
		return (
			<YStack
				backgroundColor={theme.background.val}
				padding='2'
				alignItems='center'
				justifyContent='center'
			>
				<SizableText> </SizableText>
			</YStack>
		)
	}

	const customBlurhash = typeof payload?.blurhash === 'string' ? payload.blurhash : undefined

	return (
		<GestureDetector gesture={gesture}>
			<Animated.View
				collapsable={false}
				testID='miniplayer-test-id'
				entering={SlideInDown.springify()}
			>
				<YStack
					onPress={openPlayer}
					backgroundColor={theme.background.val}
					{...ICON_PRESS_STYLES}
				>
					<MiniPlayerProgress />
					<XStack alignItems='center' padding='2'>
						<YStack justify='center' alignItems='center'>
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
							>
								<ItemImage
									key={item.AlbumId} // Without this, a failed image load means all image loading stops
									item={item!}
									customBlurhash={customBlurhash}
									width={'3'}
									height={'3'}
									imageOptions={{ maxWidth: 120, maxHeight: 120 }}
									elevate
								/>
							</Animated.View>
						</YStack>

						<YStack
							alignContent='flex-start'
							justifyContent='center'
							marginHorizontal='2'
							flex={1}
						>
							<Animated.View
								entering={FadeIn.easing(Easing.in(Easing.ease))}
								exiting={FadeOut.easing(Easing.out(Easing.ease))}
								key={`${nowPlaying!.id}-mini-player-song-info`}
							>
								<Ticker>
									<SizableText fontWeight='6' fontSize='2'>
										{nowPlaying.title ?? 'Nothing Playing'}
									</SizableText>
								</Ticker>

								<Ticker>
									<SizableText fontSize='2'>
										{nowPlaying.artist ?? 'Unknown Artist'}
									</SizableText>
								</Ticker>
							</Animated.View>
						</YStack>

						<XStack justifyContent='center' alignItems='center' flexShrink={1}>
							<PlayPauseIcon />
						</XStack>
					</XStack>
				</YStack>
			</Animated.View>
		</GestureDetector>
	)
}
