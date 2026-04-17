import { H3, Paragraph, Spinner, ToggleGroup, XStack, YStack } from 'tamagui'
import React, { useEffect, useState } from 'react'
import { Text } from '../helpers/text'
import Button from '../helpers/button'
import { BaseItemDto, CollectionType } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import { useJellifyLibrary } from '../../../stores'
import Animated, { Easing, FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useLibraries } from '../../../api/queries/libraries'

interface LibrarySelectorProps {
	onLibrarySelected: (libraryId: string, selectedLibrary: BaseItemDto) => void
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
				hoverStyle={{
					scale: 0.925,
				}}
				pressStyle={{
					scale: 0.875,
				}}
				transition={'quick'}
				backgroundColor={isSelected ? '$primary' : '$background'}
				borderWidth={hasMultipleLibraries ? 1 : 0}
				borderColor={isSelected ? '$primary' : '$borderColor'}
			>
				<Paragraph
					fontWeight={isSelected ? 'bold' : 'unset'}
					color={isSelected ? '$background' : '$neutral'}
				>
					{library.Name ?? 'Unnamed Library'}
				</Paragraph>
			</ToggleGroup.Item>
		)
	})

	return (
		<YStack
			flex={1}
			justifyContent='center'
			paddingHorizontal={'$4'}
			marginBottom={isOnboarding ? '$20' : '$4'}
			testID='library_selection_screen'
		>
			<Animated.View
				entering={FadeInUp.easing(Easing.in(Easing.ease))}
				exiting={FadeOutUp.easing(Easing.out(Easing.ease))}
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<H3 textAlign='center' marginBottom={'$2'} testID='library_selection_title'>
					{title}
				</H3>
			</Animated.View>
			{!hasMultipleLibraries && !isOnboarding && (
				<Animated.View
					entering={FadeInUp.easing(Easing.in(Easing.ease))}
					exiting={FadeOutUp.easing(Easing.out(Easing.ease))}
				>
					<Text color='$borderColor' textAlign='center'>
						Only one music library is available
					</Text>
				</Animated.View>
			)}

			{isPending ? (
				<Spinner size='large' enterStyle={{ opacity: 1 }} exitStyle={{ opacity: 0 }} />
			) : isError ? (
				<LoadErrorMessage />
			) : musicLibraries.length === 0 ? (
				<NoLibrariesMessage />
			) : (
				<ToggleGroup
					width='100%'
					borderRadius={'$4'}
					orientation='vertical'
					type='single'
					disableDeactivation={true}
					value={selectedLibraryId}
					onValueChange={setSelectedLibraryId}
					disabled={!hasMultipleLibraries && !isOnboarding}
				>
					{libraryToggleItems}
				</ToggleGroup>
			)}

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
					disabled={!selectedLibraryId}
					icon={() => <Icon name={primaryButtonIcon} small color='$primary' />}
					onPress={handleLibrarySelection}
					testID='let_s_go_button'
					flex={1}
				>
					<Paragraph color={'$primary'} fontWeight={'$6'}>
						{primaryButtonText}
					</Paragraph>
				</Button>
			</XStack>
		</YStack>
	)
}

function LoadErrorMessage(): React.JSX.Element {
	return (
		<Text color='$warning' textAlign='center'>
			Unable to load libraries
		</Text>
	)
}

function NoLibrariesMessage(): React.JSX.Element {
	return (
		<YStack alignItems='center' gap={'$2'}>
			<Icon name='alert' color='$warning' />
			<Text color='$warning' textAlign='center'>
				No music libraries found
			</Text>
			<Text color='$borderColor' textAlign='center' fontSize={'$3'}>
				Please create a music library in Jellyfin to continue
			</Text>
		</YStack>
	)
}
