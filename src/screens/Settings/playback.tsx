import LookaheadSettings from '../../components/Settings/components/settings/lookahead'
import { YStack, XStack, SizableText, RadioGroup, ScrollView, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/utils/radio-group-item-with-label'
import { usePlayerSettingsStore } from '../../stores/settings/player'
import { StreamingQuality } from '../../enums/audio-quality'

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
		setLookahead,
	} = usePlayerSettingsStore()

	return (
		<ScrollView
			contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
			showsVerticalScrollIndicator={false}
			testID='settings-screen-playback'
		>
			<YStack gap='4' margin='4'>
				<YStack gap='3'>
					<YStack gap='1'>
						<SizableText fontSize='3' fontWeight='6'>
							Streaming Quality
						</SizableText>
						<SizableText fontSize='2' color='borderColor'>
							Changes apply to new tracks
						</SizableText>
					</YStack>
					<RadioGroup
						value={streamingQuality}
						onValueChange={(value) => setStreamingQuality(value as StreamingQuality)}
						gap='3'
					>
						<RadioGroupItemWithLabel
							size='3'
							value={StreamingQuality.Original}
							label='Original Quality'
						/>
						<RadioGroupItemWithLabel
							size='3'
							value={StreamingQuality.High}
							label='High (320kbps)'
						/>
						<RadioGroupItemWithLabel
							size='3'
							value={StreamingQuality.Medium}
							label='Medium (256kbps)'
						/>
						<RadioGroupItemWithLabel
							size='3'
							value={StreamingQuality.Low}
							label='Low (192kbps)'
						/>
					</RadioGroup>
				</YStack>

				<XStack alignItems='center' justifyContent='space-between'>
					<YStack flex={1}>
						<SizableText fontSize='3' fontWeight='6'>
							Audio Normalization
						</SizableText>
						<SizableText fontSize='2' color='borderColor'>
							Normalize volume between tracks
						</SizableText>
					</YStack>
					<SwitchWithLabel
						checked={enableAudioNormalization}
						onCheckedChange={setEnableAudioNormalization}
						size='2'
					/>
				</XStack>

				<XStack alignItems='center' justifyContent='space-between'>
					<YStack flex={1}>
						<SizableText fontSize='3' fontWeight='6'>
							Quality Badge
						</SizableText>
						<SizableText fontSize='2' color='borderColor'>
							Display audio quality in player
						</SizableText>
					</YStack>
					<SwitchWithLabel
						checked={displayAudioQualityBadge}
						onCheckedChange={setDisplayAudioQualityBadge}
						size='2'
					/>
				</XStack>

				<LookaheadSettings />
			</YStack>
		</ScrollView>
	)
}
