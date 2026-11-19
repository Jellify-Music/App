import Input from '../../components/Global/utils/Input'
import React, { useState } from 'react'
import { Label, Spinner, XStack, SizableText, YStack } from 'tamagui'
import Button from '../../components/Global/utils/button'
import Icon from '../../components/Global/components/icon'
import { isEmpty } from 'lodash'
import { useAddPlaylist } from '../../api/mutations/playlist'
import { LibraryStackNavigator } from './types'
import { useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'

export default function AddPlaylist(): React.JSX.Element {
	const { t } = useTranslation()

	const libraryStackNavigation = useNavigation<LibraryStackNavigator>()

	const [name, setName] = useState<string>('')

	const addPlaylist = useAddPlaylist()

	return (
		<YStack margin='4' flex={1} gap='4'>
			<YStack gap='2'>
				<Label size='2' htmlFor='name' fontWeight='6' justifyContent='flex-end'>
					{t('playlist.name')}
				</Label>
				<Input id='name' onChangeText={setName} />
			</YStack>
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
						{t('common.cancel')}
					</SizableText>
				</Button>
				<Button
					onPress={() => addPlaylist.mutate({ name })}
					flex={1}
					borderWidth={'1'}
					borderColor={'primary'}
					icon={
						!addPlaylist.isPending ? (
							<Icon name='content-save' size='6' color={'primary'} />
						) : undefined
					}
					disabled={isEmpty(name) || addPlaylist.isPending}
				>
					{addPlaylist.isPending ? (
						<Spinner color='primary' />
					) : (
						<SizableText fontSize='2' fontWeight='6' color={'primary'}>
							{t('common.save')}
						</SizableText>
					)}
				</Button>
			</XStack>
		</YStack>
	)
}
