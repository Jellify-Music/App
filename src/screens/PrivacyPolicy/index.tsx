import { Paragraph, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrivacyPolicyProps } from '../types'
import { Linking } from 'react-native'
import { PRIVACY_POLICY_URL } from '../../configs/privacy.config'
import { Trans, useTranslation } from 'react-i18next'

export default function PrivacyPolicyScreen(props: PrivacyPolicyProps): React.JSX.Element {
	const { t } = useTranslation()

	const { top, bottom } = useSafeAreaInsets()

	const onGlitchTipPress = () => {
		Linking.openURL(PRIVACY_POLICY_URL)
	}

	return (
		<YStack
			alignItems='center'
			justifyContent='center'
			marginHorizontal='2'
			marginVertical={bottom}
			gap='4'
		>
			<Paragraph textAlign='center' fontSize='3' fontWeight='6'>
				{t('privacy.intro')}
			</Paragraph>

			<Paragraph textAlign='center' fontSize='3'>
				{t('privacy.purpose')}
			</Paragraph>

			<Paragraph textAlign='center' fontSize='3'>
				{t('privacy.optional')}
			</Paragraph>

			<Paragraph textAlign='center' fontSize='3'>
				<Trans
					i18nKey='privacy.readMore'
					components={{
						link: (
							<Paragraph
								textAlign='center'
								fontSize='3'
								color='primary'
								onPress={onGlitchTipPress}
							/>
						),
					}}
				/>
			</Paragraph>
		</YStack>
	)
}
