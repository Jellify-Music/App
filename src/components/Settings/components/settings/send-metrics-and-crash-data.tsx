import { SwitchWithLabel } from '../../../Global/utils/switch-with-label'
import { useSendMetricsSetting } from '../../../../stores/settings/app'
import { XStack, YStack, SizableText } from 'tamagui'
import { useNavigation, RootNavigator } from '@react-navigation/native'
import Icon from '../../../../components/Global/components/icon'
import { useTranslation } from 'react-i18next'

export default function SendMetricsAndCrashDataSetting(): React.JSX.Element {
	const { t } = useTranslation()

	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	const navigation = useNavigation<RootNavigator>()

	const onDisclaimerPress = () => {
		navigation.navigate('PrivacyPolicy')
	}

	return (
		<XStack flexShrink={1} alignItems='center' justifyContent='space-between'>
			<YStack flex={1} gap='1'>
				<SizableText fontSize='3' fontWeight='6'>
					{t('settings.analytics.title')}
				</SizableText>
				<XStack onPress={onDisclaimerPress}>
					<Icon name='information-outline' size={'3'} color='primary' />
					<SizableText fontSize='2' fontWeight='4' color='primary'>
						{t('settings.analytics.learnMore')}
					</SizableText>
				</XStack>
			</YStack>
			<SwitchWithLabel checked={sendMetrics} onCheckedChange={setSendMetrics} size='2' />
		</XStack>
	)
}
