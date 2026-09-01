import { SwitchWithLabel } from '../../../../components/Global/helpers/switch-with-label'
import { useSendMetricsSetting } from '../../../../stores/settings/app'
import { XStack, YStack, SizableText } from 'tamagui'

export default function SendMetricsAndCrashDataSetting(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	return (
		<XStack alignItems='center' justifyContent='space-between'>
			<YStack flex={1}>
				<SizableText size='$4' fontWeight={'$6'}>
					Send Analytics
				</SizableText>
				<SizableText size='$2' color='$borderColor'>
					Send usage and crash data
				</SizableText>
			</YStack>
			<SwitchWithLabel checked={sendMetrics} onCheckedChange={setSendMetrics} size='$2' />
		</XStack>
	)
}
