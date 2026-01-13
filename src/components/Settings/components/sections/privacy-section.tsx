import React from 'react'
import { XStack, YStack, SizableText } from 'tamagui'

import SettingsSection from '../settings-section'
import { SwitchWithLabel } from '../../../Global/helpers/switch-with-label'
import { useReducedHapticsSetting, useSendMetricsSetting } from '../../../../stores/settings/app'

export default function PrivacySection(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()
	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()

	return (
		<SettingsSection title='Privacy' icon='shield-account' iconColor='$success'>
			<XStack alignItems='center' justifyContent='space-between'>
				<YStack flex={1}>
					<SizableText size='$4'>Send Analytics</SizableText>
					<SizableText size='$2' color='$borderColor'>
						Send usage and crash data
					</SizableText>
				</YStack>
				<SwitchWithLabel
					checked={sendMetrics}
					onCheckedChange={setSendMetrics}
					size='$2'
					label=''
				/>
			</XStack>

			<XStack alignItems='center' justifyContent='space-between'>
				<YStack flex={1}>
					<SizableText size='$4'>Reduce Haptics</SizableText>
					<SizableText size='$2' color='$borderColor'>
						Reduce haptic feedback intensity
					</SizableText>
				</YStack>
				<SwitchWithLabel
					checked={reducedHaptics}
					onCheckedChange={setReducedHaptics}
					size='$2'
					label=''
				/>
			</XStack>
		</SettingsSection>
	)
}
