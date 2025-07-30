import React from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../../components/types'
import { useJellifyContext } from '../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import LibrarySelector from '../../components/Global/components/library-selector'

export default function ServerLibrary({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { setUser, setLibrary } = useJellifyContext()

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
		navigation.navigate('Tabs', {
			screen: 'Home',
			params: {},
		})
	}

	const handleCancel = () => {
		setUser(undefined)
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
