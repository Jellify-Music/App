import { Label, Text } from '../../components/Global/helpers/text'
import Input from '../../components/Global/helpers/input'
import React, { useState } from 'react'
import { View, XStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../components/types'
import { useMutation } from '@tanstack/react-query'
import { createPlaylist } from '../../api/mutations/playlists'
import { trigger } from 'react-native-haptic-feedback'
import { queryClient } from '../../constants/query-client'
import { QueryKeys } from '../../enums/query-keys'
import Toast from 'react-native-toast-message'
import { useJellifyContext } from '../../providers'
import Icon from '../../components/Global/components/icon'

export default function AddPlaylist({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList, 'AddPlaylist'>
}): React.JSX.Element {
	const { api, user, library } = useJellifyContext()
	const [name, setName] = useState<string>('')

	const useAddPlaylist = useMutation({
		mutationFn: ({ name }: { name: string }) => createPlaylist(api, user, name),
		onSuccess: (data, { name }) => {
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
			queryClient.invalidateQueries({
				queryKey: [QueryKeys.UserPlaylists],
			})
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
