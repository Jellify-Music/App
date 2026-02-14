import React, { useCallback, useMemo } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Button, Card, Paragraph, Separator, SizableText, Spinner, XStack, YStack } from 'tamagui'

import Icon from '../../components/Global/components/icon'
import { SettingsStackParamList } from './types'
import { useStorageContext } from '../../providers/Storage'
import { formatBytes } from '../../utils/formatting/bytes'
import { useDeletionToast } from './storage-management/useDeletionToast'

const formatSavedAt = (timestamp: number) => {
	const parsedDate = new Date(timestamp)
	if (Number.isNaN(parsedDate.getTime())) return 'Unknown save date'
	return parsedDate.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	})
}

export default function StorageSelectionModal({
	navigation,
}: NativeStackScreenProps<SettingsStackParamList, 'StorageSelectionReview'>): React.JSX.Element {
	const { downloads, selection, deleteSelection, clearSelection, isDeleting } =
		useStorageContext()
	const showDeletionToast = useDeletionToast()
	const { bottom } = useSafeAreaInsets()

	const selectedDownloads = useMemo(
		() => downloads?.filter((download) => selection[download.trackId]) ?? [],
		[downloads, selection],
	)

	const selectedBytes = useMemo(
		() => selectedDownloads.reduce((total, download) => total + download.fileSize, 0),
		[selectedDownloads],
	)

	const handleDelete = useCallback(async () => {
		const result = await deleteSelection()
		showDeletionToast(`Deleted ${selectedDownloads.length} downloads`, 0)
		navigation.goBack()
	}, [deleteSelection, navigation, selectedDownloads.length, showDeletionToast])

	const handleClose = useCallback(() => {
		navigation.goBack()
	}, [navigation])

	const hasSelection = selectedDownloads.length > 0

	return (
		<YStack
			flex={1}
			backgroundColor='$background'
			padding='$4'
			paddingBottom={bottom + 16}
			gap='$4'
		>
			<XStack justifyContent='space-between' alignItems='center'>
				<Button
					variant='outlined'
					size='$2'
					icon={<Icon name='chevron-left' color='$color' />}
					onPress={handleClose}
				>
					Close
				</Button>
				<SizableText size='$6' fontWeight='700'>
					Review selection
				</SizableText>
				<Button
					variant='outlined'
					size='$2'
					icon={<Icon name='broom' color='$color' />}
					onPress={clearSelection}
					disabled={!hasSelection}
				>
					Clear
				</Button>
			</XStack>

			{hasSelection ? (
				<YStack gap='$4' flex={1}>
					<Card borderWidth={1} borderColor='$borderColor' borderRadius='$6' padding='$4'>
						<SizableText size='$7' fontWeight='700'>
							{formatBytes(selectedBytes)}
						</SizableText>
						<Paragraph color='$borderColor'>
							{selectedDownloads.length}{' '}
							{selectedDownloads.length === 1 ? 'track' : 'tracks'} ready to remove
						</Paragraph>
					</Card>

					<Card borderWidth={1} borderColor='$borderColor' borderRadius='$6' flex={1}>
						<ScrollView>
							{selectedDownloads.map((download, index) => (
								<YStack key={download.trackId as string}>
									<YStack padding='$3' gap='$1'>
										<SizableText fontWeight='600'>
											{download.originalTrack.title ?? 'Unknown track'}
										</SizableText>
										<Paragraph color='$borderColor'>
											{download.originalTrack.album} ·{' '}
											{formatBytes(download.fileSize)}
										</Paragraph>
										<Paragraph color='$borderColor'>
											Saved {formatSavedAt(download.downloadedAt)}
										</Paragraph>
									</YStack>
									{index < selectedDownloads.length - 1 && <Separator />}
								</YStack>
							))}
						</ScrollView>
					</Card>

					<Button
						icon={isDeleting ? <Spinner /> : <Icon name='trash' color='$danger' />}
						onPress={handleDelete}
						disabled={isDeleting}
						backgroundColor='$danger'
						color='white'
					>
						Delete downloads
					</Button>
				</YStack>
			) : (
				<Card borderWidth={1} borderColor='$borderColor' borderRadius='$6' padding='$4'>
					<SizableText size='$5' fontWeight='600'>
						No tracks selected
					</SizableText>
					<Paragraph color='$borderColor'>
						Select some downloads to clean up storage.
					</Paragraph>
				</Card>
			)}
		</YStack>
	)
}
