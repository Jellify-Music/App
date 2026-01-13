import React from 'react'
import { YStack, XStack, SizableText, RadioGroup, ScrollView } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/helpers/radio-group-item-with-label'
import {
	useDisplayAudioQualityBadge,
	useEnableAudioNormalization,
	useStreamingQuality,
} from '../../stores/settings/player'
import StreamingQuality from '../../enums/audio-quality'

export default function PlaybackScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const [streamingQuality, setStreamingQuality] = useStreamingQuality()
	const [enableAudioNormalization, setEnableAudioNormalization] = useEnableAudioNormalization()
	const [displayAudioQualityBadge, setDisplayAudioQualityBadge] = useDisplayAudioQualityBadge()

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack padding='$4' gap='$6'>
					<YStack gap='$3'>
						<YStack gap='$1'>
							<SizableText size='$4' fontWeight='600'>
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
							<SizableText size='$4'>Audio Normalization</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Normalize volume between tracks
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={enableAudioNormalization}
							onCheckedChange={setEnableAudioNormalization}
							size='$2'
							label=''
						/>
					</XStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Quality Badge</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Display audio quality in player
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={displayAudioQualityBadge}
							onCheckedChange={setDisplayAudioQualityBadge}
							size='$2'
							label=''
						/>
					</XStack>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
