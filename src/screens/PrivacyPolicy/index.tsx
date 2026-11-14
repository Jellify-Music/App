import { Paragraph, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrivacyPolicyProps } from '../types'
import { Linking } from 'react-native'
import { PRIVACY_POLICY_URL } from '../../configs/privacy.config'

export default function PrivacyPolicyScreen(props: PrivacyPolicyProps): React.JSX.Element {
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
				Jellify is equipped with GlitchTip for error tracking and reporting.
			</Paragraph>

			<Paragraph textAlign='center' fontSize='3'>
				This enables Jellify to collect and report issues automatically.
			</Paragraph>

			<Paragraph textAlign='center' fontSize='3'>
				This is entirely optional, off by default, and can be toggled at any time.
			</Paragraph>

			<Paragraph textAlign='center' fontSize='3'>
				You can read more about how this data is handled in our{' '}
				<Paragraph
					textAlign='center'
					fontSize='3'
					color='primary'
					onPress={onGlitchTipPress}
				>
					privacy policy
				</Paragraph>
				.
			</Paragraph>
		</YStack>
	)
}
