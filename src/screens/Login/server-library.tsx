import React from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import LibrarySelector from '../../components/Global/components/library-selector'
import LoginStackParamList from './types'
import { useJellifyLibrary } from '../../stores'
import navigationRef from '../../navigation/ref'

export default function ServerLibrary({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const [, setLibrary] = useJellifyLibrary()

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
		navigationRef.navigate('Tabs', { screen: 'HomeTab' })
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
