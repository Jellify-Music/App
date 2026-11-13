import { SwitchWithLabel } from '../../../Global/utils/switch-with-label'
import { useSendMetricsSetting } from '../../../../stores/settings/app'
import { XStack, SizableText } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '@/src/screens/types'
import Icon from '../../../../components/Global/components/icon'
import { Setting } from '../sections'

export default function SendMetricsAndCrashDataSetting(): React.JSX.Element {
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const onDisclaimerPress = () => {
		navigation.navigate('PrivacyPolicy')
	}

	return (
		<Setting
			title='Send Analytics'
			description={
				<XStack onPress={onDisclaimerPress}>
					<Icon name='information-outline' size={'3'} color='primary' />
					<SizableText fontSize='2' fontWeight='4' color='primary'>
						Learn more
					</SizableText>
				</XStack>
			}
			orientation='horizontal'
		>
			<SwitchWithLabel checked={sendMetrics} onCheckedChange={setSendMetrics} size='2' />
		</Setting>
	)
}
