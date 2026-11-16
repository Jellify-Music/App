import { AnimatePresence, YStack } from 'tamagui'
import { H3, H5 } from 'tamagui'
import AnimatedJellifyLogo from '../../Branding/animated-logo'
import { useTranslation } from 'react-i18next'

export default function Heading(): React.JSX.Element {
	const { t } = useTranslation()

	return (
		<YStack flexGrow={1} gap='2'>
			<AnimatedJellifyLogo rotateColor />
			<AnimatePresence>
				<H3 opacity={'1 enter:0 exit:0'} textAlign='center' testID='server_address_title'>
					{t('login.welcome')}
				</H3>

				<H5 opacity={'1 enter:0 exit:0'} textAlign='center'>
					{t('login.welcomeSubtitle')}
				</H5>
			</AnimatePresence>
		</YStack>
	)
}
