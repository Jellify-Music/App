import React, { useState } from 'react'
import { Label, Spinner, XStack, SizableText, YStack } from 'tamagui'
import { isEmpty } from 'lodash'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Input from '../Global/utils/input'
import Button from '../Global/utils/button'
import Icon from '../Global/components/icon'
import LibraryStackParamList from '../../screens/Library/types'
import {
	useGeneratePlaylistWithAudioMuseAI,
	useSaveAudioMuseAIPlaylist,
} from '../../api/mutations/audiomuse-ai'

export default function GeneratePlaylist(): React.JSX.Element {
	const libraryStackNavigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const [prompt, setPrompt] = useState<string>('')
	const [name, setName] = useState<string>('')

	const generatePlaylist = useGeneratePlaylistWithAudioMuseAI()
	const savePlaylist = useSaveAudioMuseAIPlaylist()

	const tracks = generatePlaylist.data?.response.query_results ?? null
	const hasGenerated = generatePlaylist.isSuccess

	const onGenerate = () => {
		// Guards the keyboard's submit key, which ignores the button's disabled state
		if (isEmpty(prompt.trim()) || generatePlaylist.isPending) return

		generatePlaylist.mutate(prompt.trim(), {
			onSuccess: () => {
				if (isEmpty(name)) setName(prompt.trim())
			},
		})
	}

	const onSave = () =>
		tracks &&
		savePlaylist.mutate({
			name: name.trim(),
			itemIds: tracks.map((track) => track.item_id),
		})

	return (
		<YStack margin='4' gap='4'>
			<YStack gap='2'>
				<Label size='2' htmlFor='prompt' fontWeight='6' justifyContent='flex-end'>
					What do you want to listen to?
				</Label>
				<Input
					id='prompt'
					placeholder='Songs for a rainy afternoon'
					value={prompt}
					onChangeText={setPrompt}
					returnKeyType='go'
					onSubmitEditing={onGenerate}
				/>
			</YStack>

			{hasGenerated &&
				(tracks && tracks.length > 0 ? (
					<YStack gap='2'>
						<SizableText fontSize='2' fontWeight='6' color='borderColor'>
							{`${tracks.length} tracks generated`}
						</SizableText>

						<Label size='2' htmlFor='name' fontWeight='6' justifyContent='flex-end'>
							Name
						</Label>
						<Input id='name' value={name} onChangeText={setName} />
					</YStack>
				) : (
					<SizableText fontSize='2' color='borderColor'>
						No tracks matched that request. Try describing it differently.
					</SizableText>
				))}

			<XStack justifyContent='space-evenly' gap='2'>
				<Button
					danger
					borderWidth={'1'}
					borderColor={'borderColor'}
					onPress={libraryStackNavigation.goBack}
					flex={1}
					icon={<Icon name='chevron-left' size='6' color={'borderColor'} />}
				>
					<SizableText fontSize='2' fontWeight='6' color={'borderColor'}>
						Cancel
					</SizableText>
				</Button>

				<Button
					onPress={onGenerate}
					flex={1}
					borderWidth={'1'}
					borderColor={'primary'}
					icon={
						!generatePlaylist.isPending ? (
							<Icon
								name={hasGenerated ? 'refresh' : 'creation'}
								size='6'
								color={'primary'}
							/>
						) : undefined
					}
					disabled={isEmpty(prompt.trim()) || generatePlaylist.isPending}
				>
					{generatePlaylist.isPending ? (
						<Spinner color='primary' />
					) : (
						<SizableText fontSize='2' fontWeight='6' color={'primary'}>
							{hasGenerated ? 'Retry' : 'Generate'}
						</SizableText>
					)}
				</Button>

				{tracks && tracks.length > 0 && (
					<Button
						onPress={onSave}
						flex={1}
						borderWidth={'1'}
						borderColor={'primary'}
						icon={
							!savePlaylist.isPending ? (
								<Icon name='content-save' size='6' color={'primary'} />
							) : undefined
						}
						disabled={
							isEmpty(name.trim()) ||
							savePlaylist.isPending ||
							generatePlaylist.isPending
						}
					>
						{savePlaylist.isPending ? (
							<Spinner color='primary' />
						) : (
							<SizableText fontSize='2' fontWeight='6' color={'primary'}>
								Save
							</SizableText>
						)}
					</Button>
				)}
			</XStack>
		</YStack>
	)
}
