import React, { useState } from 'react'
import SignOut from './sign-out-button'
import { SettingsStackParamList } from '../../../screens/Settings/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../../Global/helpers/text'
import SettingsListGroup from './settings-list-group'
import HTTPS from '../../../constants/protocols'
import { useJellifyUser, useJellifyLibrary, useJellifyServer } from '../../../stores'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { useDeveloperOptionsEnabled, usePrId } from '../../../stores/settings/developer'
import { YStack, XStack } from 'tamagui'
import Input from '../../Global/helpers/input'
import Button from '../../Global/helpers/button'
import Icon from '../../Global/components/icon'
import { Alert } from 'react-native'
import { SettingsTabList } from '../types'
import { downloadPRUpdate } from '../../OtaUpdates/otaPR'

export default function AccountTab(): React.JSX.Element {
	const [server] = useJellifyServer()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()
	const [developerOptionsEnabled, setDeveloperOptionsEnabled] = useDeveloperOptionsEnabled()
	const [prId, setPrId] = usePrId()
	const [localPrId, setLocalPrId] = useState(prId)

	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const handleSubmitPr = () => {
		if (localPrId.trim()) {
			setPrId(localPrId.trim())
			downloadPRUpdate(Number(localPrId.trim()))
		} else {
			Alert.alert('Error', 'Please enter a valid PR ID')
		}
	}

	const settingsList: SettingsTabList = [
		{
			title: 'Username',
			subTitle: 'You are awesome!',
			iconName: 'account-music',
			iconColor: '$borderColor',
			children: <Text>{user?.name ?? 'Unknown User'}</Text>,
		},
		{
			title: 'Selected Library',
			subTitle: 'Tap to change library',
			iconName: 'book-music',
			iconColor: '$borderColor',
			children: <Text>{library?.musicLibraryName ?? 'Unknown Library'}</Text>,
			onPress: () => navigation.navigate('LibrarySelection'),
		},
		{
			title: server?.name ?? 'Untitled Server',
			subTitle: server?.version ?? 'Unknown Jellyfin Version',
			iconName: server?.url.includes(HTTPS) ? 'lock' : 'lock-open',
			iconColor: server?.url.includes(HTTPS) ? '$success' : '$borderColor',
			children: <Text>{server?.address ?? 'Unknown Server'}</Text>,
		},
		{
			title: 'Developer Options',
			subTitle: 'Enable advanced developer features',
			iconName: developerOptionsEnabled ? 'code-braces' : 'code-braces-box',
			iconColor: developerOptionsEnabled ? '$success' : '$borderColor',
			children: (
				<YStack gap='$2'>
					<SwitchWithLabel
						checked={developerOptionsEnabled}
						onCheckedChange={setDeveloperOptionsEnabled}
						size={'$2'}
						label={developerOptionsEnabled ? 'Enabled' : 'Disabled'}
					/>
					{developerOptionsEnabled && (
						<YStack gap='$3' paddingTop='$2'>
							<Text color='$borderColor'>
								Enter PR ID to test pull request builds
							</Text>
							<XStack gap='$2' alignItems='center' width='80%'>
								<Input
									flex={1}
									placeholder='Enter PR ID'
									value={localPrId}
									onChangeText={setLocalPrId}
									keyboardType='numeric'
									size='$3'
								/>
								<Button
									size='$3'
									backgroundColor='$primary'
									color='$background'
									onPress={handleSubmitPr}
									circular
									icon={<Icon name='check' color='$background' small />}
								/>
							</XStack>
							{prId && (
								<Text color='$success' fontSize={'$2'}>
									{`Current PR ID: ${prId}`}
								</Text>
							)}
						</YStack>
					)}
				</YStack>
			),
		},
	]

	return (
		<>
			<SettingsListGroup settingsList={settingsList} />
			<SignOut navigation={navigation} />
		</>
	)
}
