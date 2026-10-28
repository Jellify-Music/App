import { AnimatePresence, YStack } from 'tamagui'
import { H3, H5 } from 'tamagui'
import AnimatedJellifyLogo from '../../Branding/animated-logo'

export default function Heading(): React.JSX.Element {
	return (
		<YStack flexGrow={1} gap='2'>
			<AnimatedJellifyLogo rotateColor sharedTransitionTag='login' />
			<AnimatePresence>
				<H3 opacity={'1 enter:0 exit:0'} textAlign='center' testID='server_address_title'>
					Welcome!
				</H3>

				<H5 opacity={'1 enter:0 exit:0'} textAlign='center'>
					Let&apos;s get connected to Jellyfin
				</H5>
			</AnimatePresence>
		</YStack>
	)
}
