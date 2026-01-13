import React from 'react'
import { XStack, YStack, SizableText, RadioGroup } from 'tamagui'

import SettingsSection from '../settings-section'
import { SwitchWithLabel } from '../../../Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../../Global/helpers/radio-group-item-with-label'
import {
	useDisplayAudioQualityBadge,
	useEnableAudioNormalization,
	useStreamingQuality,
} from '../../../../stores/settings/player'
import StreamingQuality from '../../../../enums/audio-quality'

export default function PlaybackSection(): React.JSX.Element {
	const [streamingQuality, setStreamingQuality] = useStreamingQuality()
	const [enableAudioNormalization, setEnableAudioNormalization] = useEnableAudioNormalization()
	const [displayAudioQualityBadge, setDisplayAudioQualityBadge] = useDisplayAudioQualityBadge()

	return (
		<SettingsSection title='Playback' icon='play-circle' iconColor='$warning'>
			<YStack gap='$2'>
				<SizableText size='$4'>Streaming Quality</SizableText>
				<SizableText size='$2' color='$borderColor'>
					Changes apply to new tracks
				</SizableText>
				<RadioGroup
					value={streamingQuality}
					onValueChange={(value) => setStreamingQuality(value as StreamingQuality)}
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
		</SettingsSection>
	)
}
