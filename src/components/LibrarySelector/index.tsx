import { SizableText, Spinner, ToggleGroup, XStack, YGroup, YStack } from 'tamagui'
import React, { useEffect, useState } from 'react'
import Button from '../Global/helpers/button'
import { BaseItemDto, CollectionType } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from '../Global/components/icon'
import { useJellifyLibrary } from '../../stores/auth'
import { useLibraries } from '../../api/queries/libraries'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import OneLibraryMessage from './components/one-library'
import Heading from './components/heading'
import NoLibrariesMessage from './components/no-libraries'
import LoadErrorMessage from './components/loading-error'

interface LibrarySelectorProps {
	onLibrarySelected: (libraryId: string, selectedLibrary: BaseItemDto) => void
	onCancel: () => void
	primaryButtonText: string
	primaryButtonIcon: MaterialDesignIconsIconName
	cancelButtonText: string
	cancelButtonIcon: MaterialDesignIconsIconName
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
	const [library] = useJellifyLibrary()

	const { data: libraries, isError, isPending, isSuccess } = useLibraries()

	const [musicLibraries, setMusicLibraries] = useState<BaseItemDto[]>([])

	const [selectedLibraryId, setSelectedLibraryId] = useState<string | undefined>(
		library?.musicLibraryId,
	)
	const handleLibrarySelection = () => {
		if (!selectedLibraryId || !libraries) return

		const selectedLibrary = libraries.find((lib) => lib.Id === selectedLibraryId)

		if (selectedLibrary) {
			onLibrarySelected(selectedLibraryId, selectedLibrary)
		}
	}

	const hasMultipleLibraries = musicLibraries.length > 1

	useEffect(() => {
		if (!isPending && isSuccess && libraries) {
			const filteredMusicLibraries = libraries.filter(
				(library) => library.CollectionType === CollectionType.Music,
			)
			setMusicLibraries(filteredMusicLibraries)

			// Auto-select if there's only one music library
			if (filteredMusicLibraries.length === 1 && !selectedLibraryId) {
				setSelectedLibraryId(filteredMusicLibraries[0].Id)
			}
		}
	}, [isPending, isSuccess, libraries])

	const libraryToggleItems = musicLibraries.map((library) => {
		const isSelected: boolean = selectedLibraryId === library.Id!

		return (
			<ToggleGroup.Item
				key={library.Id}
				value={library.Id!}
				aria-label={library.Name!}
				width='100%'
				scale='1 hover:0.925 press:0.875'
				transition={'quick'}
				backgroundColor={`${isSelected ? 'primary' : 'background'}`}
				borderWidth={hasMultipleLibraries ? 1 : 0}
				borderColor={`${isSelected ? 'primary' : 'borderColor'}`}
				borderRadius='2'
			>
				<SizableText
					fontWeight={`${isSelected ? '8' : '2'}`}
					color={`${isSelected ? 'background' : 'neutral'}`}
					fontSize='3'
				>
					{library.Name ?? 'Unnamed Library'}
				</SizableText>
			</ToggleGroup.Item>
		)
	})

	return (
		<YStack flex={1} margin='4' testID='library_selection_screen' justifyContent='flex-end'>
			<YStack flex={1} justifyContent='center'>
				<Heading title={title} />
			</YStack>

			{!hasMultipleLibraries && !isOnboarding && <OneLibraryMessage />}

			<YStack flexShrink={1}>
				{isPending ? (
					<Spinner size='large' opacity='1 enter:1 exit:0' />
				) : isError ? (
					<LoadErrorMessage />
				) : musicLibraries.length === 0 ? (
					<NoLibrariesMessage />
				) : (
					<ToggleGroup
						borderRadius='2'
						marginVertical='4'
						type='single'
						disableDeactivation={true}
						value={selectedLibraryId}
						onValueChange={setSelectedLibraryId}
						disabled={!hasMultipleLibraries && !isOnboarding}
					>
						<YGroup>{libraryToggleItems}</YGroup>
					</ToggleGroup>
				)}

				<XStack flexShrink={1} alignItems='flex-end' gap='3'>
					{showCancelButton && (
						<Button
							variant='outlined'
							borderColor={'borderColor'}
							icon={<Icon name={cancelButtonIcon} size='7' />}
							onPress={onCancel}
							flex={1}
							borderWidth={'1'}
						>
							{cancelButtonText}
						</Button>
					)}

					<Button
						variant='outlined'
						borderColor={'primary'}
						disabled={!selectedLibraryId}
						icon={<Icon name={primaryButtonIcon} size='7' color='primary' />}
						onPress={handleLibrarySelection}
						testID='let_s_go_button'
						flex={1}
						borderWidth={'1'}
					>
						<SizableText color='primary' fontWeight='6' fontSize='3'>
							{primaryButtonText}
						</SizableText>
					</Button>
				</XStack>
			</YStack>
		</YStack>
	)
}
