import { Label, Text } from '../../components/Global/helpers/text'
import Input from '../../components/Global/helpers/input'
import React, { useState } from 'react'
import { Spinner, View, XStack } from 'tamagui'
import Button from '../../components/Global/helpers/button'
import Icon from '../../components/Global/components/icon'
import { isEmpty } from 'lodash'
import { useAddPlaylist } from '../../api/mutations/playlist'
import LibraryStackParamList from './types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'

export default function AddPlaylist(): React.JSX.Element {
	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const [name, setName] = useState<string>('')

	const addPlaylist = useAddPlaylist()

	return (
		<View margin={'$2'} flex={1}>
			<Label size='$2' htmlFor='name'>
				Name
			</Label>
			<Input id='name' onChangeText={setName} />
			<XStack justifyContent='space-evenly' gap={'$2'}>
				<Button
					danger
					borderWidth={'$1'}
					borderColor={'$borderColor'}
					onPress={libraryStackNavigation.goBack}
					flex={1}
					icon={() => <Icon name='chevron-left' small color={'$borderColor'} />}
				>
					<Text bold color={'$borderColor'}>
						Cancel
					</Text>
				</Button>
				<Button
					onPress={() => addPlaylist.mutate({ name })}
					flex={1}
					borderWidth={'$1'}
					borderColor={'$primary'}
					icon={
						!addPlaylist.isPending ? (
							<Icon name='content-save' small color={'$primary'} />
						) : undefined
					}
					disabled={isEmpty(name) || addPlaylist.isPending}
				>
					{addPlaylist.isPending ? (
						<Spinner color={'$primary'} />
					) : (
						<Text bold color={'$primary'}>
							Save
						</Text>
					)}
				</Button>
			</XStack>
		</View>
	)
}
