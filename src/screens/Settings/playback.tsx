import React from 'react'
import {
	YStack,
	XStack,
	SizableText,
	RadioGroup,
	ScrollView,
	useTheme,
	getTokenValue,
} from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/helpers/radio-group-item-with-label'
import { usePlayerSettingsStore } from '../../stores/settings/player'
import StreamingQuality from '../../enums/audio-quality'
import { DEFAULT_PLAYER_LOOKAHEAD } from '../../configs/player.config'
import Slider from '@jellify-music/react-native-reanimated-slider'
import Animated, { useAnimatedReaction, useSharedValue } from 'react-native-reanimated'
import { runOnJS } from 'react-native-worklets'

export default function PlaybackScreen(): React.JSX.Element {
	const { primary, neutral } = useTheme()

	const { bottom } = useSafeAreaInsets()

	const {
		streamingQuality,
		setStreamingQuality,
		enableAudioNormalization,
		setEnableAudioNormalization,
		displayAudioQualityBadge,
		setDisplayAudioQualityBadge,
		lookahead,
		setLookahead,
	} = usePlayerSettingsStore()

	const lookaheadSharedValue = useSharedValue(lookahead)

	const handleLookaheadChange = async (value: number) => {
		Math.round(value)
		if (isNaN(value) || value < 1 || value > 10) {
			await setLookahead(DEFAULT_PLAYER_LOOKAHEAD)
		} else {
			await setLookahead(value)
		}
	}

	useAnimatedReaction(
		() => lookaheadSharedValue,
		(prepared) => {
			const rounded = Math.round(prepared.value)
			if (rounded !== lookahead) {
				runOnJS(handleLookaheadChange)(rounded)
			}
		},
	)

	return (
		<YStack flex={1} backgroundColor='$background' testID='settings-screen-playback'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='$4' gap='$6'>
					<YStack gap='$3'>
						<YStack gap='$1'>
							<SizableText size='$4' fontWeight='$6'>
								Streaming Quality
							</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Changes apply to new tracks
							</SizableText>
						</YStack>
						<RadioGroup
							value={streamingQuality}
							onValueChange={(value) =>
								setStreamingQuality(value as StreamingQuality)
							}
						>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Original}
								label='Original Quality'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.High}
								label='High (320kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Medium}
								label='Medium (192kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Low}
								label='Low (128kbps)'
							/>
						</RadioGroup>
					</YStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4' fontWeight='$6'>
								Audio Normalization
							</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Normalize volume between tracks
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={enableAudioNormalization}
							onCheckedChange={setEnableAudioNormalization}
							size='$2'
						/>
					</XStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4' fontWeight='$6'>
								Quality Badge
							</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Display audio quality in player
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={displayAudioQualityBadge}
							onCheckedChange={setDisplayAudioQualityBadge}
							size='$2'
						/>
					</XStack>

					<YStack alignItems='flex-start' gap='$3'>
						<XStack alignItems='center' justifyContent='space-between' width='100%'>
							<YStack flex={1}>
								<SizableText size='$4' fontWeight='$6'>
									Track Lookahead
								</SizableText>
								<SizableText size='$2' color='$borderColor'>
									Number of upcoming tracks to prefetch
								</SizableText>
							</YStack>

							<Animated.Text
								style={{
									color: primary.val,
									fontSize: getTokenValue('$4'),
									fontWeight: getTokenValue('$6'),
								}}
							>
								{lookahead}
							</Animated.Text>
						</XStack>

						<Slider
							value={lookaheadSharedValue}
							onValueChange={handleLookaheadChange}
							maxValue={10}
							thumbWidth={8}
							color={primary.val}
							backgroundColor={neutral.val}
							thumbShadowColor={getTokenValue('$color.black')}
							trackHeight={getTokenValue('$2')}
						/>
					</YStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
