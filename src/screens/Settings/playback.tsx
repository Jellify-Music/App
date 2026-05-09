import React from 'react'
import { YStack, XStack, SizableText, RadioGroup, ScrollView, Input } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/helpers/radio-group-item-with-label'
import { usePlayerSettingsStore } from '../../stores/settings/player'
import StreamingQuality from '../../enums/audio-quality'
import { DEFAULT_PLAYER_LOOKAHEAD } from '../../configs/player.config'

export default function PlaybackScreen(): React.JSX.Element {
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

	const handleLookaheadChange = async (value: string) => {
		const numericValue = Number(value)
		if (isNaN(numericValue) || numericValue < 1 || numericValue > 10) {
			await setLookahead(DEFAULT_PLAYER_LOOKAHEAD)
		} else {
			await setLookahead(numericValue)
		}
	}

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

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4' fontWeight='$6'>
								Track Lookahead
							</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Number of upcoming tracks to prefetch
							</SizableText>
						</YStack>

						<Input
							value={lookahead.toString()}
							onChangeText={handleLookaheadChange}
							type='number'
							keyboardType='numeric'
							min={1}
							max={10}
							fontWeight={'$6'}
							flexShrink={1}
							textAlign='right'
							borderRadius={'$2'}
							borderWidth={0}
							borderBottomWidth={'$2'}
							borderColor={'$success'}
						/>
					</XStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
