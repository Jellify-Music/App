import { Label, Text } from '../../components/Global/helpers/text'
import Input from '../../components/Global/helpers/input'
import React, { useState } from 'react'
import { View, XStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useMutation } from '@tanstack/react-query'
import { createPlaylist } from '../../api/mutations/playlists'
import Toast from 'react-native-toast-message'
import Icon from '../../components/Global/components/icon'
import LibraryStackParamList from './types'
import useHapticFeedback from '../../hooks/use-haptic-feedback'
import { useUserPlaylists } from '../../api/queries/playlist'
import { useApi, useJellifyUser, useJellifyLibrary } from '../../stores'

export default function AddPlaylist({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LibraryStackParamList, 'AddPlaylist'>
}): React.JSX.Element {
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [name, setName] = useState<string>('')

	const { refetch } = useUserPlaylists()

	const trigger = useHapticFeedback()

	const useAddPlaylist = useMutation({
		mutationFn: ({ name }: { name: string }) => createPlaylist(api, user, name),
		onSuccess: (data: void, { name }: { name: string }) => {
			trigger('notificationSuccess')

			// Burnt.alert({
			// 	title: `Playlist created`,
			// 	message: `Created playlist ${name}`,
			// 	duration: 1,
			// 	preset: 'done',
			// })
			Toast.show({
				text1: 'Playlist created',
				text2: `Created playlist ${name}`,
				type: 'success',
			})

			navigation.goBack()

			// Refresh user playlists component in library
			refetch()
		},
		onError: () => {
			trigger('notificationError')
		},
	})

	return (
		<View margin={'$2'}>
			<Label size='$2' htmlFor='name'>
				Name
			</Label>
			<Input id='name' onChangeText={setName} />
			<XStack justifyContent='space-evenly' gap={'$2'}>
				<Button
					danger
					borderWidth={'$1'}
					borderColor={'$borderColor'}
					onPress={() => navigation.goBack()}
					flex={1}
					icon={() => <Icon name='chevron-left' small color={'$borderColor'} />}
				>
					<Text bold color={'$borderColor'}>
						Cancel
					</Text>
				</Button>
				<Button
					onPress={() => useAddPlaylist.mutate({ name })}
					flex={1}
					borderWidth={'$1'}
					borderColor={'$primary'}
					icon={() => <Icon name='content-save' small color={'$primary'} />}
				>
					<Text bold color={'$primary'}>
						Save
					</Text>
				</Button>
			</XStack>
		</View>
	)
}
