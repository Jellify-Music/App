import { XStack, YStack } from 'tamagui'
import { SignOutModalProps } from './types'
import { H5, Text } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import Icon from '../../components/Global/components/icon'
import { useJellifyContext } from '../../providers'
import { useNetworkContext } from '../../providers/Network'
import { useResetQueue } from '../../providers/Player/hooks/mutations'
import navigationRef from '../../../navigation'
import { useClearAllDownloads } from '../../api/mutations/download'

export default function SignOutModal({ navigation }: SignOutModalProps): React.JSX.Element {
	const { server } = useJellifyContext()

	const { mutate: resetQueue } = useResetQueue()
	const clearDownloads = useClearAllDownloads()

	return (
		<YStack margin={'$6'}>
			<H5>{`Sign out of ${server?.name ?? 'Jellyfin'}?`}</H5>
			<XStack gap={'$2'}>
				<Button
					icon={() => <Icon name='chevron-left' small color={'$borderColor'} />}
					borderWidth={'$1'}
					borderColor={'$borderColor'}
					flex={1}
					onPress={() => {
						navigation.goBack()
					}}
				>
					<Text bold color={'$borderColor'}>
						Cancel
					</Text>
				</Button>
				<Button
					testID='sign-out-button'
					flex={1}
					icon={() => <Icon name='logout' small color={'$danger'} />}
					color={'$danger'}
					borderColor={'$danger'}
					onPress={() => {
						navigation.goBack()
						navigationRef.navigate('Login', { screen: 'ServerAddress' }, { pop: true })

						clearDownloads()
						resetQueue()
					}}
				>
					<Text bold color={'$danger'}>
						Sign out
					</Text>
				</Button>
			</XStack>
		</YStack>
	)
}
