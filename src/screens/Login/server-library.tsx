import React from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'
import { useJellifyContext } from '../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import LibrarySelector from '../../components/Global/components/library-selector'
import LoginStackParamList from './types'
import { useNavigation } from '@react-navigation/native'

export default function ServerLibrary({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const { setLibrary } = useJellifyContext()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const handleLibrarySelected = (
		libraryId: string,
		selectedLibrary: BaseItemDto,
		playlistLibrary?: BaseItemDto,
	) => {
		setLibrary({
			musicLibraryId: libraryId,
			musicLibraryName: selectedLibrary.Name ?? 'No library name',
			musicLibraryPrimaryImageId: selectedLibrary.ImageTags?.Primary,
			playlistLibraryId: playlistLibrary?.Id,
			playlistLibraryPrimaryImageId: playlistLibrary?.ImageTags?.Primary,
		})
		rootNavigation.navigate('Tabs', { screen: 'HomeTab' })
	}

	const handleCancel = () => {
		navigation.navigate('ServerAuthentication', undefined, {
			pop: true,
		})
	}

	return (
		<LibrarySelector
			onLibrarySelected={handleLibrarySelected}
			onCancel={handleCancel}
			primaryButtonText="Let's Go!"
			primaryButtonIcon='guitar-electric'
			cancelButtonText='Switch User'
			cancelButtonIcon='chevron-left'
			isOnboarding={true}
		/>
	)
}
