import React from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { Card, Separator, SizableText, Spinner, XStack, YStack } from 'tamagui'
import Button from '../../components/Global/utils/button'
import Icon from '../../components/Global/components/icon'
import { SettingsStackNavigator } from './types'
import { useStorageContext } from '../../providers/Storage'
import { formatBytes } from '../../utils/formatting/bytes'
import { useDeletionToast } from '../../utils/toasts/deletion-toast'
import useDownloads from '../../hooks/downloads'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'

const formatSavedAt = (timestamp: number) => {
	const parsedDate = new Date(timestamp)
	if (Number.isNaN(parsedDate.getTime())) return i18n.t('storage.unknownSaveDate')
	return parsedDate.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	})
}

export default function StorageSelectionModal(): React.JSX.Element {
	const { t } = useTranslation()

	const navigation = useNavigation<SettingsStackNavigator>()

	const { data: downloads } = useDownloads()

	const { selection, deleteSelection, clearSelection, isDeleting } = useStorageContext()
	const showDeletionToast = useDeletionToast()
	const { bottom } = useSafeAreaInsets()

	const selectedDownloads = downloads?.filter((download) => selection[download.trackId]) ?? []

	const selectedBytes = selectedDownloads.reduce(
		(total, download) => total + download.fileSize,
		0,
	)

	const handleDelete = async () => {
		const result = await deleteSelection()
		showDeletionToast(t('storage.deletedDownloads', { count: selectedDownloads.length }), 0)
		navigation.goBack()
	}

	const handleClose = () => {
		navigation.goBack()
	}

	const hasSelection = selectedDownloads.length > 0

	return (
		<YStack
			flex={1}
			backgroundColor='background'
			padding='4'
			paddingBottom={bottom + 16}
			gap='4'
		>
			<XStack justifyContent='space-between' alignItems='center'>
				<Button
					variant='outlined'
					icon={<Icon name='chevron-left' color='color' />}
					onPress={handleClose}
				>
					{t('common.close')}
				</Button>
				<SizableText size='2' fontWeight='6'>
					{t('storage.reviewSelection')}
				</SizableText>
				<Button
					variant='outlined'
					icon={<Icon name='broom' color='color' />}
					onPress={clearSelection}
					disabled={!hasSelection}
				>
					{t('common.clear')}
				</Button>
			</XStack>

			{hasSelection ? (
				<YStack gap='4' flex={1}>
					<Card borderWidth={1} borderColor='borderColor' borderRadius='6' padding='4'>
						<SizableText fontSize='2' fontWeight='6'>
							{formatBytes(selectedBytes)}
						</SizableText>
						<SizableText fontSize='2' color='borderColor'>
							{t('storage.readyToRemove', { count: selectedDownloads.length })}
						</SizableText>
					</Card>

					<Card borderWidth={1} borderColor='borderColor' borderRadius='6' flex={1}>
						<ScrollView>
							{selectedDownloads.map((download, index) => (
								<YStack key={download.trackId as string}>
									<YStack padding='3' gap='1'>
										<SizableText fontSize='2' fontWeight='6'>
											{download.originalTrack.title ??
												t('placeholders.unknownTrack')}
										</SizableText>
										<SizableText fontSize='2' color='borderColor'>
											{download.originalTrack.album} ·{' '}
											{formatBytes(download.fileSize)}
										</SizableText>
										<SizableText fontSize='2' color='borderColor'>
											{t('storage.savedAt', {
												date: formatSavedAt(download.downloadedAt),
											})}
										</SizableText>
									</YStack>
									{index < selectedDownloads.length - 1 && <Separator />}
								</YStack>
							))}
						</ScrollView>
					</Card>

					<Button
						icon={isDeleting ? <Spinner /> : <Icon name='delete' color='danger' />}
						onPress={handleDelete}
						disabled={isDeleting}
						backgroundColor='danger'
					>
						<SizableText fontSize='2' fontWeight='6' color='background'>
							{t('storage.deleteDownloads')}
						</SizableText>
					</Button>
				</YStack>
			) : (
				<Card borderWidth={1} borderColor='borderColor' borderRadius='6' padding='4'>
					<SizableText fontSize='2' fontWeight='6'>
						{t('storage.noneSelected')}
					</SizableText>
					<SizableText fontSize='2' color='borderColor'>
						{t('storage.noneSelectedHint')}
					</SizableText>
				</Card>
			)}
		</YStack>
	)
}
