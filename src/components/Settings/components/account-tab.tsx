import React from 'react'
import { useJellifyContext } from '../../../providers'
import { SafeAreaView } from 'react-native-safe-area-context'
import SignOut from './sign-out-button'
import { SettingsStackParamList } from '../../../screens/Settings/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../../Global/helpers/text'
import SettingsListGroup from './settings-list-group'
import { https } from '../../Login/utils/constants'

export default function AccountTab(): React.JSX.Element {
	const { user, library, server } = useJellifyContext()

	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	return (
		<>
			<SettingsListGroup
				settingsList={[
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
						iconName: server?.url.includes(https) ? 'lock' : 'lock-open',
						iconColor: server?.url.includes(https) ? '$success' : '$borderColor',
						children: <Text>{server?.address ?? 'Unknown Server'}</Text>,
					},
				]}
			/>
			<SignOut navigation={navigation} />
		</>
	)
}
