import { SwitchWithLabel } from '../../../../components/Global/helpers/switch-with-label'
import { useSendMetricsSetting } from '../../../../stores/settings/app'
import { XStack, YStack, SizableText } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/src/screens/types'
import Icon from '../../../../components/Global/components/icon'

export default function SendMetricsAndCrashDataSetting(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const onDisclaimerPress = () => {
		navigation.navigate('PrivacyPolicy')
	}

	return (
		<XStack flexShrink={1} alignItems='center' justifyContent='space-between'>
			<YStack flex={1} gap='1'>
				<SizableText fontSize='3' fontWeight='6'>
					Send Analytics
				</SizableText>
				<XStack onPress={onDisclaimerPress}>
					<Icon name='information-outline' size={'3'} color='primary' />
					<SizableText fontSize='2' fontWeight='4' color='primary'>
						Learn more
					</SizableText>
				</XStack>
			</YStack>
			<SwitchWithLabel checked={sendMetrics} onCheckedChange={setSendMetrics} size='2' />
		</XStack>
	)
}
