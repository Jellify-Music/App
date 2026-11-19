import LookaheadSettings from '../../components/Settings/components/settings/lookahead'
import { YStack, XStack, SizableText, RadioGroup, ScrollView, useTheme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/utils/radio-group-item-with-label'
import { usePlayerSettingsStore } from '../../stores/settings/player'
import { StreamingQuality } from '../../enums/audio-quality'
import { useTranslation } from 'react-i18next'

export default function PlaybackScreen(): React.JSX.Element {
	const { t } = useTranslation()

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
		<YStack flex={1} backgroundColor='background' testID='settings-screen-playback'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
				showsVerticalScrollIndicator={false}
			>
				<YStack
					padding='4'
					gap='4'
					borderColor='borderColor'
					borderWidth='1'
					borderRadius='4'
					margin='2'
				>
					<YStack gap='3'>
						<YStack gap='1'>
							<SizableText fontSize='3' fontWeight='6'>
								{t('settings.playback.streamingQuality')}
							</SizableText>
							<SizableText fontSize='2' color='borderColor'>
								{t('settings.playback.streamingQualityDescription')}
							</SizableText>
						</YStack>
						<RadioGroup
							value={streamingQuality}
							onValueChange={(value) =>
								setStreamingQuality(value as StreamingQuality)
							}
							gap='3'
						>
							<RadioGroupItemWithLabel
								size='3'
								value={StreamingQuality.Original}
								label={t('settings.quality.original')}
							/>
							<RadioGroupItemWithLabel
								size='3'
								value={StreamingQuality.High}
								label={t('settings.quality.high')}
							/>
							<RadioGroupItemWithLabel
								size='3'
								value={StreamingQuality.Medium}
								label={t('settings.quality.medium')}
							/>
							<RadioGroupItemWithLabel
								size='3'
								value={StreamingQuality.Low}
								label={t('settings.quality.low')}
							/>
						</RadioGroup>
					</YStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText fontSize='3' fontWeight='6'>
								{t('settings.playback.normalization')}
							</SizableText>
							<SizableText fontSize='2' color='borderColor'>
								{t('settings.playback.normalizationDescription')}
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
								{t('settings.playback.qualityBadge')}
							</SizableText>
							<SizableText fontSize='2' color='borderColor'>
								{t('settings.playback.qualityBadgeDescription')}
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
		</YStack>
	)
}
