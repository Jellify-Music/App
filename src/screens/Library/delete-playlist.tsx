import { Spinner, XStack, YStack, SizableText } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import Icon from '../../components/Global/components/icon'
import LibraryStackParamList, { LibraryDeletePlaylistProps } from '../Library/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useDeletePlaylist } from '../../api/mutations/playlist'

export default function DeletePlaylist({ route }: LibraryDeletePlaylistProps): React.JSX.Element {
	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const deletePlaylist = useDeletePlaylist()

	const { bottom } = useSafeAreaInsets()

	return (
		<YStack margin='4' gap='4' justifyContent='space-between' marginBottom={bottom}>
			<SizableText fontWeight='6' textAlign='center'>
				{`Delete playlist ${route.params.playlist.Name ?? 'Untitled Playlist'}?`}
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
						Cancel
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
							Delete
						</SizableText>
					)}
				</Button>
			</XStack>
		</YStack>
	)
}
