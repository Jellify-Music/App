import { Spinner, XStack, YStack, SizableText } from 'tamagui'
import Button from '../../components/Global/utils/button'
import Icon from '../../components/Global/components/icon'
import { LibraryDeletePlaylistProps } from '../Library/types'
import { LibraryStackNavigator } from '../Library/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useDeletePlaylist } from '../../api/mutations/playlist'
import { useTranslation } from 'react-i18next'

export default function DeletePlaylist({ route }: LibraryDeletePlaylistProps): React.JSX.Element {
	const { t } = useTranslation()

	const libraryStackNavigation = useNavigation<LibraryStackNavigator>()

	const deletePlaylist = useDeletePlaylist()

	const { bottom } = useSafeAreaInsets()

	return (
		<YStack margin='4' gap='4' justifyContent='space-between' marginBottom={bottom}>
			<SizableText fontWeight='6' textAlign='center'>
				{t('playlist.deleteConfirm', {
					name: route.params.playlist.Name ?? t('placeholders.untitledPlaylist'),
				})}
			</SizableText>
			<XStack justifyContent='space-evenly' gap='2'>
				<Button
					onPress={() => libraryStackNavigation.goBack()}
					flex={1}
					borderWidth={'1'}
					borderColor={'borderColor'}
					icon={() => <Icon name='chevron-left' size='7' color={'borderColor'} />}
				>
					<SizableText fontWeight='6' color={'borderColor'}>
						{t('common.cancel')}
					</SizableText>
				</Button>
				<Button
					danger
					flex={1}
					borderWidth={'1'}
					borderColor={'warning'}
					onPress={() => deletePlaylist.mutate(route.params.playlist)}
					icon={
						!deletePlaylist.isPending ? (
							<Icon name='trash-can-outline' size='7' color={'warning'} />
						) : undefined
					}
				>
					{deletePlaylist.isPending ? (
						<Spinner color='warning' />
					) : (
						<SizableText fontWeight='6' color={'warning'}>
							{t('common.delete')}
						</SizableText>
					)}
				</Button>
			</XStack>
		</YStack>
	)
}
