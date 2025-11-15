import React, { useEffect, useMemo, useState } from 'react'
import { Spinner, ToggleGroup, XStack, YStack } from 'tamagui'
import { H2, Text } from '../helpers/text'
import Button from '../helpers/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../../enums/query-keys'
import { fetchUserViews } from '../../../api/queries/libraries'
import { useQuery } from '@tanstack/react-query'
import Icon from './icon'
import { useApi, useJellifyLibrary, useJellifyUser } from '../../../stores'

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
	const api = useApi()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	const {
		data: libraries,
		isError,
		isPending,
		isSuccess,
	} = useQuery({
		queryKey: [QueryKeys.UserViews],
		queryFn: () => fetchUserViews(api, user),
		staleTime: 0, // Refetch on mount
	})

	const [musicLibraries, setMusicLibraries] = useState<BaseItemDto[]>([])

	const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(
		library?.musicLibraryId,
	)
	const [playlistLibrary, setPlaylistLibrary] = useState<BaseItemDto | undefined>(undefined)

	const handleLibrarySelection = () => {
		if (!selectedLibraryId || !libraries) return

		const selectedLibrary = libraries.find((lib) => lib.Id === selectedLibraryId)

		if (selectedLibrary) {
			onLibrarySelected(selectedLibraryId, selectedLibrary, playlistLibrary)
		}
	}

	const hasMultipleLibraries = musicLibraries.length > 1

	useEffect(() => {
		if (libraries) {
			setMusicLibraries(libraries.filter((library) => library.CollectionType === 'music'))
		}
	}, [libraries, isPending])

	useEffect(() => {
		if (!isPending && isSuccess && libraries) {
			// Find the playlist library
			const foundPlaylistLibrary = libraries.find((lib) => lib.CollectionType === 'playlists')
			setPlaylistLibrary(foundPlaylistLibrary)
		}
	}, [isPending, isSuccess, libraries])

	const libraryToggleItems = useMemo(
		() =>
			musicLibraries.map((library) => {
				const isSelected: boolean = selectedLibraryId === library.Id!

				return (
					<ToggleGroup.Item
						key={library.Id}
						value={library.Id!}
						aria-label={library.Name!}
						pressStyle={{
							scale: 0.9,
						}}
						backgroundColor={isSelected ? '$primary' : '$background'}
					>
						<Text
							fontWeight={isSelected ? 'bold' : '600'}
							color={isSelected ? '$background' : '$neutral'}
						>
							{library.Name ?? 'Unnamed Library'}
						</Text>
					</ToggleGroup.Item>
				)
			}),
		[selectedLibraryId, musicLibraries],
	)

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack flex={1} justifyContent='center' paddingHorizontal={'$4'}>
				<YStack flex={1} alignItems='center' justifyContent='flex-end'>
					<H2 textAlign='center' marginBottom={'$2'}>
						{title}
					</H2>
					{!hasMultipleLibraries && !isOnboarding && (
						<Text color='$borderColor' textAlign='center'>
							Only one music library is available
						</Text>
					)}
				</YStack>

				<YStack justifyContent='center' flexGrow={1} minHeight={'$12'} gap={'$4'}>
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
							animation={'quick'}
							disableDeactivation={true}
							value={selectedLibraryId}
							onValueChange={setSelectedLibraryId}
							disabled={!hasMultipleLibraries && !isOnboarding}
						>
							{libraryToggleItems}
						</ToggleGroup>
					)}
				</YStack>

				<XStack alignItems='flex-end' gap={'$3'} marginTop={'$4'}>
					{showCancelButton && (
						<Button
							variant='outlined'
							icon={() => <Icon name={cancelButtonIcon} small />}
							onPress={onCancel}
							flex={1}
						>
							{cancelButtonText}
						</Button>
					)}

					<Button
						variant='outlined'
						borderColor={'$primary'}
						color={'$primary'}
						disabled={!selectedLibraryId}
						icon={() => <Icon name={primaryButtonIcon} small color='$primary' />}
						onPress={handleLibrarySelection}
						testID='let_s_go_button'
						flex={1}
					>
						{primaryButtonText}
					</Button>
				</XStack>
			</YStack>
		</SafeAreaView>
	)
}
