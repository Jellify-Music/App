import React, { useEffect, useState } from 'react'
import { getToken, Spinner, ToggleGroup, YStack } from 'tamagui'
import { H2, Text } from '../helpers/text'
import Button from '../helpers/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJellifyContext } from '../../../providers'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserViews } from '../../../api/queries/libraries'
import { useQuery } from '@tanstack/react-query'
import Icon from './icon'

interface LibrarySelectorProps {
	onLibrarySelected: (
		libraryId: string,
		selectedLibrary: BaseItemDto,
		playlistLibrary?: BaseItemDto,
	) => void
	onCancel: () => void
	primaryButtonText: string
	primaryButtonIcon: string
	cancelButtonText: string
	cancelButtonIcon: string
	title?: string
	showCancelButton?: boolean
	isOnboarding?: boolean
}

export default function LibrarySelector({
	onLibrarySelected,
	onCancel,
	primaryButtonText,
	primaryButtonIcon,
	cancelButtonText,
	cancelButtonIcon,
	title = 'Select Music Library',
	showCancelButton = true,
	isOnboarding = false,
}: LibrarySelectorProps): React.JSX.Element {
	const { api, user, library } = useJellifyContext()

	const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(
		library?.musicLibraryId,
	)
	const [playlistLibrary, setPlaylistLibrary] = useState<BaseItemDto | undefined>(undefined)

	const {
		data: libraries,
		isError,
		isPending,
		isSuccess,
	} = useQuery({
		queryKey: [QueryKeys.UserViews],
		queryFn: () => fetchUserViews(api, user),
	})

	useEffect(() => {
		if (!isPending && isSuccess && libraries) {
			// Find the playlist library
			const foundPlaylistLibrary = libraries.find((lib) => lib.CollectionType === 'playlists')
			setPlaylistLibrary(foundPlaylistLibrary)
		}
	}, [isPending, isSuccess, libraries])

	const handleLibrarySelection = () => {
		if (!selectedLibraryId || !libraries) return

		const selectedLibrary = libraries.find((lib) => lib.Id === selectedLibraryId)

		if (selectedLibrary) {
			onLibrarySelected(selectedLibraryId, selectedLibrary, playlistLibrary)
		}
	}

	const musicLibraries = libraries?.filter((library) => library.CollectionType === 'music') ?? []
	const hasMultipleLibraries = musicLibraries.length > 1 && !musicLibraries.length

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack flex={1} justifyContent='center' paddingHorizontal={'$4'}>
				<YStack alignItems='center' marginBottom={'$6'}>
					<H2 textAlign='center' marginBottom={'$2'}>
						{title}
					</H2>
					{!hasMultipleLibraries && !isOnboarding && (
						<Text color='$borderColor' textAlign='center'>
							Only one music library is available
						</Text>
					)}
				</YStack>

				<YStack gap={'$4'}>
					{isPending ? (
						<Spinner size='large' />
					) : isError ? (
						<Text color='$danger' textAlign='center'>
							Unable to load libraries
						</Text>
					) : (
						<ToggleGroup
							orientation='vertical'
							type='single'
							disableDeactivation={true}
							value={selectedLibraryId}
							onValueChange={setSelectedLibraryId}
							disabled={!hasMultipleLibraries && !isOnboarding}
						>
							{musicLibraries.map((library) => (
								<ToggleGroup.Item
									key={library.Id}
									value={library.Id!}
									aria-label={library.Name!}
									backgroundColor={
										selectedLibraryId === library.Id
											? getToken('$color.purpleGray')
											: 'unset'
									}
									opacity={!hasMultipleLibraries && !isOnboarding ? 0.6 : 1}
								>
									<Text>{library.Name ?? 'Unnamed Library'}</Text>
								</ToggleGroup.Item>
							))}
						</ToggleGroup>
					)}

					<YStack gap={'$3'} marginTop={'$4'}>
						<Button
							disabled={!selectedLibraryId}
							icon={() => <Icon name={primaryButtonIcon} small />}
							onPress={handleLibrarySelection}
							testID='let_s_go_button'
						>
							{primaryButtonText}
						</Button>

						{showCancelButton && (
							<Button
								variant='outlined'
								icon={() => <Icon name={cancelButtonIcon} small />}
								onPress={onCancel}
							>
								{cancelButtonText}
							</Button>
						)}
					</YStack>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}
