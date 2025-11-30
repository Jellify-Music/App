import { Label, Text } from '../../components/Global/helpers/text'
import Input from '../../components/Global/helpers/input'
import React, { useState } from 'react'
import { View, XStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Icon from '../../components/Global/components/icon'
import LibraryStackParamList from './types'
import { useCreatePlaylist } from '../../api/mutations/playlist'

export default function AddPlaylist({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LibraryStackParamList, 'AddPlaylist'>
}): React.JSX.Element {
	const [name, setName] = useState<string>('')

	const createPlaylistMutation = useCreatePlaylist()

	const handleSave = () => {
		createPlaylistMutation.mutate(
			{ name },
			{
				onSuccess: () => {
					navigation.goBack()
				},
			},
		)
	}

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
					onPress={handleSave}
					flex={1}
					borderWidth={'$1'}
					borderColor={'$primary'}
					disabled={createPlaylistMutation.isPending}
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
