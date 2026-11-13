import LookaheadSettings from '../../components/Settings/components/settings/lookahead'
import SettingsNavRow from '../../components/Settings/components/settings-nav-row'
import { RadioGroup, ScrollView, Separator } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/utils/radio-group-item-with-label'
import { usePlayerSettingsStore } from '../../stores/settings/player'
import { StreamingQuality } from '../../enums/audio-quality'
import { Setting } from '../../components/Settings/components/sections'

export default function PlaybackScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()

	const {
		streamingQuality,
		setStreamingQuality,
		enableAudioNormalization,
		setEnableAudioNormalization,
		displayAudioQualityBadge,
		setDisplayAudioQualityBadge,
	} = usePlayerSettingsStore()

	return (
		<ScrollView
			contentContainerStyle={{ paddingBottom: Math.max(bottom, 16) + 16 }}
			showsVerticalScrollIndicator={false}
			testID='settings-screen-playback'
			gap='2'
		>
			<Setting
				title='Streaming Quality'
				description='Changes apply to new tracks'
				orientation='vertical'
			>
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
			</Setting>

			<Separator borderColor='borderColor' />

			<Setting
				title='Audio Normalization'
				description='Normalize volume between tracks'
				orientation='horizontal'
			>
				<SwitchWithLabel
					checked={enableAudioNormalization}
					onCheckedChange={setEnableAudioNormalization}
					size='2'
				/>
			</Setting>

			<Separator borderColor='borderColor' />

			<Setting
				title='Quality Badge'
				description='Display audio quality in player'
				orientation='horizontal'
			>
				<SwitchWithLabel
					checked={displayAudioQualityBadge}
					onCheckedChange={setDisplayAudioQualityBadge}
					size='2'
				/>
			</Setting>

			<Separator borderColor='borderColor' />

			<LookaheadSettings />

			<Separator borderColor='borderColor' />

			<SettingsNavRow
				testID='settings-nav-equalizer'
				title='Equalizer'
				icon='equalizer'
				route='Equalizer'
				iconColor='success'
			/>
		</ScrollView>
	)
}
