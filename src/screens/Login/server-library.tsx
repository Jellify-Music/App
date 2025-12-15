import React, { useEffect } from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import LibrarySelector from '../../components/Global/components/library-selector'
import LoginStackParamList from './types'
import { useNavigation } from '@react-navigation/native'
import { useJellifyLibrary, useJellifyServer } from '../../stores'

export default function ServerLibrary({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const [server] = useJellifyServer()
	const [, setLibrary] = useJellifyLibrary()

	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	// For Navidrome, skip library selection entirely - it doesn't have multiple libraries
	useEffect(() => {
		if (server?.backend === 'navidrome') {
			// Set a dummy library for Navidrome (it uses a single library)
			setLibrary({
				musicLibraryId: 'navidrome', // Placeholder - not used for Navidrome API calls
				musicLibraryName: 'Music',
				musicLibraryPrimaryImageId: undefined,
				playlistLibraryId: undefined,
				playlistLibraryPrimaryImageId: undefined,
			})
			rootNavigation.navigate('Tabs', { screen: 'HomeTab' })
		}
	}, [server?.backend, setLibrary, rootNavigation])

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

	// For Navidrome, this will briefly show before redirecting
	// Could add a loading spinner here if needed
	if (server?.backend === 'navidrome') {
		return <></>
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
