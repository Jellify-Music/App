import React, { useState } from 'react'
import { Pressable, Alert } from 'react-native'
import {
	YStack,
	XStack,
	SizableText,
	Card,
	Spinner,
	Image,
	ScrollView,
	Separator,
	RadioGroup,
} from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useStorageContext, CleanupSuggestion } from '../../../providers/Storage'
import SettingsSection from '../../../components/Settings/components/settings-section'
import Icon from '../../../components/Global/components/icon'
import Button from '../../../components/Global/helpers/button'
import { SwitchWithLabel } from '../../../components/Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../../components/Global/helpers/radio-group-item-with-label'
import { formatBytes } from '../../../utils/formatting/bytes'
import { JellifyDownload, JellifyDownloadProgress } from '../../../types/JellifyDownload'
import { useDeletionToast } from './useDeletionToast'
import {
	DownloadQuality,
	useAutoDownload,
	useDownloadQuality,
} from '../../../stores/settings/usage'

const getDownloadSize = (download: JellifyDownload) =>
	(download.fileSizeBytes ?? 0) + (download.artworkSizeBytes ?? 0)

const formatSavedAt = (timestamp: string) => {
	const parsedDate = new Date(timestamp)
	if (Number.isNaN(parsedDate.getTime())) return 'Unknown save date'
	return parsedDate.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	})
}

export default function StorageManagementScreen(): React.JSX.Element {
	const { bottom } = useSafeAreaInsets()
	const {
		downloads,
		summary,
		suggestions,
		selection,
		toggleSelection,
		clearSelection,
		deleteDownloads,
		refresh,
		refreshing,
		activeDownloadsCount,
		activeDownloads,
		pendingDownloads,
		currentDownloads,
		cancelPendingDownload,
		clearAllPendingDownloads,
	} = useStorageContext()

	const [autoDownload, setAutoDownload] = useAutoDownload()
	const [downloadQuality, setDownloadQuality] = useDownloadQuality()

	const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null)

	const bottomPadding = Math.max(bottom, 16) + 140

	const showDeletionToast = useDeletionToast()

	const sortedDownloads = !downloads
		? []
		: [...downloads].sort(
				(a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
			)

	const selectedIds = Object.entries(selection)
		.filter(([, isSelected]) => isSelected)
		.map(([id]) => id)

	const selectedBytes =
		!selectedIds.length || !downloads
			? 0
			: downloads.reduce((total, download) => {
					return new Set(selectedIds).has(download.item.Id as string)
						? total + getDownloadSize(download)
						: total
				}, 0)

	const handleApplySuggestion = async (suggestion: CleanupSuggestion) => {
		if (!suggestion.itemIds.length) return
		setApplyingSuggestionId(suggestion.id)
		try {
			const result = await deleteDownloads(suggestion.itemIds)
			if (result?.deletedCount)
				showDeletionToast(`Removed ${result.deletedCount} downloads`, result.freedBytes)
		} finally {
			setApplyingSuggestionId(null)
		}
	}

	const handleDeleteSingle = async (download: JellifyDownload) => {
		const result = await deleteDownloads([download.item.Id as string])
		if (result?.deletedCount)
			showDeletionToast(`Removed ${download.title ?? 'track'}`, result.freedBytes)
	}

	const handleDeleteAll = () =>
		Alert.alert(
			'Clear all downloads?',
			'This will remove all downloaded music from your device. This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear All',
					style: 'destructive',
					onPress: async () => {
						if (!downloads) return
						const allIds = downloads.map((d) => d.item.Id as string)
						const result = await deleteDownloads(allIds)
						if (result?.deletedCount)
							showDeletionToast(
								`Removed ${result.deletedCount} downloads`,
								result.freedBytes,
							)
					},
				},
			],
		)

	const handleDeleteSelection = () =>
		Alert.alert(
			'Clear selected downloads?',
			`Are you sure you want to clear ${selectedIds.length} downloads?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear',
					style: 'destructive',
					onPress: async () => {
						const result = await deleteDownloads(selectedIds)
						if (result?.deletedCount) {
							showDeletionToast(
								`Removed ${result.deletedCount} downloads`,
								result.freedBytes,
							)
							clearSelection()
						}
					},
				},
			],
		)

	const totalQueueCount = pendingDownloads.length + currentDownloads.length

	return (
		<YStack flex={1} backgroundColor='$background'>
			<ScrollView
				contentContainerStyle={{ paddingBottom: bottomPadding }}
				showsVerticalScrollIndicator={false}
			>
				{/* Storage Overview Section */}
				<SettingsSection
					title='Storage Overview'
					icon='harddisk'
					iconColor='$primary'
					defaultExpanded
					collapsible={false}
				>
					{summary ? (
						<YStack gap='$3'>
							<XStack alignItems='flex-end' justifyContent='space-between'>
								<YStack gap='$1'>
									<SizableText size='$8' fontWeight='700'>
										{formatBytes(summary.usedByDownloads)}
									</SizableText>
									<SizableText size='$2' color='$borderColor'>
										Used by offline music
									</SizableText>
								</YStack>
								<YStack alignItems='flex-end' gap='$1'>
									<SizableText size='$4' fontWeight='600'>
										{formatBytes(summary.freeSpace)}
									</SizableText>
									<SizableText size='$2' color='$borderColor'>
										Free on device
									</SizableText>
								</YStack>
							</XStack>

							<ProgressBar progress={summary.usedPercentage} />

							<XStack flexWrap='wrap' gap='$2'>
								<StatChip
									label='Downloads'
									value={`${summary.downloadCount}`}
									icon='download'
								/>
								<StatChip
									label='Audio'
									value={formatBytes(summary.audioBytes)}
									icon='music-note'
								/>
								<StatChip
									label='Artwork'
									value={formatBytes(summary.artworkBytes)}
									icon='image'
								/>
							</XStack>

							<XStack gap='$2'>
								<Button
									flex={1}
									size='$3'
									backgroundColor='transparent'
									borderColor='$borderColor'
									borderWidth='$0.5'
									onPress={() => void refresh()}
									disabled={refreshing}
									icon={
										refreshing ? (
											<Spinner size='small' color='$color' />
										) : (
											<Icon name='refresh' color='$color' small />
										)
									}
								>
									<SizableText size='$3'>Refresh</SizableText>
								</Button>
								<Button
									flex={1}
									size='$3'
									backgroundColor='$warning'
									borderColor='$warning'
									borderWidth='$0.5'
									onPress={handleDeleteAll}
									icon={<Icon name='broom' color='$background' small />}
								>
									<SizableText color='$background' size='$3'>
										Clear All
									</SizableText>
								</Button>
							</XStack>
						</YStack>
					) : (
						<XStack alignItems='center' gap='$3' padding='$2'>
							<Spinner size='small' color='$primary' />
							<SizableText size='$3' color='$borderColor'>
								Calculating storage usage...
							</SizableText>
						</XStack>
					)}
				</SettingsSection>

				{/* Download Settings Section */}
				<SettingsSection
					title='Download Settings'
					icon='download'
					iconColor='$primary'
					defaultExpanded
				>
					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Auto-Download Tracks</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Download tracks as they are played
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={autoDownload}
							onCheckedChange={() => setAutoDownload(!autoDownload)}
							size='$2'
							label=''
						/>
					</XStack>

					<YStack gap='$2'>
						<SizableText size='$4'>Download Quality</SizableText>
						<RadioGroup
							value={downloadQuality}
							onValueChange={(value) => setDownloadQuality(value as DownloadQuality)}
						>
							<RadioGroupItemWithLabel
								size='$3'
								value='original'
								label='Original Quality'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value='high'
								label='High (320kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value='medium'
								label='Medium (192kbps)'
							/>
							<RadioGroupItemWithLabel size='$3' value='low' label='Low (128kbps)' />
						</RadioGroup>
					</YStack>
				</SettingsSection>

				{/* Active Downloads Section */}
				{totalQueueCount > 0 && (
					<SettingsSection
						title='Downloads in Progress'
						icon='download'
						iconColor='$success'
						defaultExpanded
					>
						<YStack gap='$2'>
							{currentDownloads.map((download) => {
								const progressInfo = activeDownloads?.[download.url ?? '']
								const progress = progressInfo?.progress ?? 0

								return (
									<XStack
										key={download.item.Id}
										alignItems='center'
										gap='$3'
										padding='$2'
										backgroundColor='$backgroundFocus'
										borderRadius='$3'
									>
										<YStack
											width={36}
											height={36}
											borderRadius='$2'
											backgroundColor='$primary'
											alignItems='center'
											justifyContent='center'
										>
											<Spinner size='small' color='$background' />
										</YStack>
										<YStack flex={1} gap='$1'>
											<SizableText
												size='$3'
												fontWeight='600'
												numberOfLines={1}
											>
												{download.title ??
													download.item.Name ??
													'Downloading...'}
											</SizableText>
											<XStack alignItems='center' gap='$2'>
												<YStack
													flex={1}
													height={3}
													borderRadius={999}
													backgroundColor='$backgroundHover'
												>
													<YStack
														height={3}
														borderRadius={999}
														backgroundColor='$success'
														width={`${Math.min(100, Math.max(0, progress * 100))}%`}
													/>
												</YStack>
												<SizableText size='$1' color='$borderColor'>
													{Math.round(progress * 100)}%
												</SizableText>
											</XStack>
										</YStack>
									</XStack>
								)
							})}

							{pendingDownloads.slice(0, 5).map((download) => (
								<XStack
									key={download.item.Id}
									alignItems='center'
									gap='$3'
									padding='$2'
									backgroundColor='$backgroundFocus'
									borderRadius='$3'
								>
									<YStack
										width={36}
										height={36}
										borderRadius='$2'
										backgroundColor='$borderColor'
										alignItems='center'
										justifyContent='center'
									>
										<Icon name='clock-outline' color='$background' small />
									</YStack>
									<YStack flex={1}>
										<SizableText size='$3' fontWeight='600' numberOfLines={1}>
											{download.title ?? download.item.Name ?? 'Queued'}
										</SizableText>
										<SizableText size='$1' color='$borderColor'>
											Waiting in queue
										</SizableText>
									</YStack>
									<Button
										size='$2'
										circular
										backgroundColor='transparent'
										hitSlop={10}
										icon={<Icon name='close' color='$warning' small />}
										onPress={() =>
											cancelPendingDownload(download.item.Id as string)
										}
									/>
								</XStack>
							))}

							{pendingDownloads.length > 5 && (
								<SizableText size='$2' color='$borderColor' textAlign='center'>
									+{pendingDownloads.length - 5} more in queue
								</SizableText>
							)}

							{pendingDownloads.length > 0 && (
								<Button
									size='$3'
									backgroundColor='$warning'
									borderColor='$warning'
									borderWidth='$0.5'
									onPress={clearAllPendingDownloads}
									icon={<Icon name='close-circle' color='$background' small />}
								>
									<SizableText color='$background' size='$3'>
										Cancel Queue
									</SizableText>
								</Button>
							)}
						</YStack>
					</SettingsSection>
				)}

				{/* Cleanup Suggestions Section */}
				{suggestions.length > 0 && (
					<SettingsSection
						title='Cleanup Ideas'
						icon='lightbulb-outline'
						iconColor='$warning'
						defaultExpanded
					>
						<YStack gap='$3'>
							{suggestions.map((suggestion) => (
								<Card
									key={suggestion.id}
									backgroundColor='$backgroundFocus'
									borderRadius='$3'
									padding='$3'
								>
									<YStack gap='$2'>
										<XStack alignItems='center' justifyContent='space-between'>
											<SizableText size='$4' fontWeight='600'>
												{suggestion.title}
											</SizableText>
											<SizableText size='$2' color='$borderColor'>
												{suggestion.count} items
											</SizableText>
										</XStack>
										<SizableText size='$2' color='$borderColor'>
											{suggestion.description}
										</SizableText>
										<Button
											size='$3'
											backgroundColor='$primary'
											borderColor='$primary'
											borderWidth='$0.5'
											disabled={applyingSuggestionId === suggestion.id}
											onPress={() => void handleApplySuggestion(suggestion)}
											icon={
												applyingSuggestionId === suggestion.id ? (
													<Spinner size='small' color='$background' />
												) : (
													<Icon name='broom' color='$background' small />
												)
											}
										>
											<SizableText color='$background' size='$3'>
												Free {formatBytes(suggestion.freedBytes)}
											</SizableText>
										</Button>
									</YStack>
								</Card>
							))}
						</YStack>
					</SettingsSection>
				)}

				{/* Selection Banner */}
				{selectedIds.length > 0 && (
					<Card
						bordered
						backgroundColor='$background'
						marginHorizontal='$3'
						marginVertical='$1.5'
						padding='$3'
					>
						<YStack gap='$3'>
							<XStack alignItems='center' justifyContent='space-between'>
								<YStack>
									<SizableText size='$4' fontWeight='600'>
										{selectedIds.length} selected
									</SizableText>
									<SizableText size='$2' color='$borderColor'>
										{formatBytes(selectedBytes)} will be freed
									</SizableText>
								</YStack>
								<Button
									size='$2'
									backgroundColor='transparent'
									borderColor='$borderColor'
									borderWidth='$0.5'
									onPress={clearSelection}
								>
									<SizableText size='$2'>Clear</SizableText>
								</Button>
							</XStack>
							<Button
								size='$3'
								backgroundColor='$warning'
								borderColor='$warning'
								borderWidth='$0.5'
								onPress={handleDeleteSelection}
								icon={<Icon name='broom' color='$background' small />}
							>
								<SizableText color='$background' size='$3'>
									Clear {formatBytes(selectedBytes)}
								</SizableText>
							</Button>
						</YStack>
					</Card>
				)}

				{/* Offline Library Section */}
				<SettingsSection
					title='Offline Library'
					icon='music-box-multiple'
					iconColor='$primary'
					defaultExpanded
					collapsible={false}
				>
					{sortedDownloads.length === 0 ? (
						<YStack alignItems='center' gap='$3' padding='$4'>
							<Icon name='cloud-off-outline' color='$borderColor' />
							<SizableText size='$4' fontWeight='600'>
								No offline music yet
							</SizableText>
							<SizableText size='$2' color='$borderColor' textAlign='center'>
								Downloaded tracks will show up here so you can manage storage any
								time.
							</SizableText>
						</YStack>
					) : (
						<YStack gap='$1'>
							<SizableText size='$2' color='$borderColor' marginBottom='$2'>
								{sortedDownloads.length}{' '}
								{sortedDownloads.length === 1 ? 'track' : 'tracks'} cached
							</SizableText>
							{sortedDownloads.map((download, index) => (
								<React.Fragment key={download.item.Id ?? index}>
									<DownloadRow
										download={download}
										isSelected={Boolean(selection[download.item.Id as string])}
										onToggle={() => toggleSelection(download.item.Id as string)}
										onDelete={() => void handleDeleteSingle(download)}
									/>
									{index < sortedDownloads.length - 1 && (
										<Separator marginVertical='$1' />
									)}
								</React.Fragment>
							))}
						</YStack>
					)}
				</SettingsSection>
			</ScrollView>
		</YStack>
	)
}

const ProgressBar = ({ progress }: { progress: number }) => (
	<YStack height={6} borderRadius={999} backgroundColor='$backgroundHover'>
		<YStack
			height={6}
			borderRadius={999}
			backgroundColor='$primary'
			width={`${Math.min(1, Math.max(0, progress)) * 100}%`}
		/>
	</YStack>
)

const StatChip = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
	<XStack
		flex={1}
		minWidth={90}
		alignItems='center'
		gap='$2'
		padding='$2'
		backgroundColor='$backgroundFocus'
		borderRadius='$3'
	>
		<Icon name={icon} color='$borderColor' small />
		<YStack>
			<SizableText size='$3' fontWeight='600'>
				{value}
			</SizableText>
			<SizableText size='$1' color='$borderColor'>
				{label}
			</SizableText>
		</YStack>
	</XStack>
)

const DownloadRow = ({
	download,
	isSelected,
	onToggle,
	onDelete,
}: {
	download: JellifyDownload
	isSelected: boolean
	onToggle: () => void
	onDelete: () => void
}) => (
	<Pressable onPress={onToggle} accessibilityRole='button'>
		<XStack padding='$2' alignItems='center' gap='$3' borderRadius='$3'>
			<Icon
				name={isSelected ? 'check-circle-outline' : 'circle-outline'}
				color={isSelected ? '$primary' : '$borderColor'}
				small
			/>

			{download.artwork ? (
				<Image
					source={{ uri: download.artwork, width: 44, height: 44 }}
					width={44}
					height={44}
					borderRadius='$2'
				/>
			) : (
				<YStack
					width={44}
					height={44}
					borderRadius='$2'
					backgroundColor='$backgroundHover'
					alignItems='center'
					justifyContent='center'
				>
					<Icon name='music-note' color='$borderColor' small />
				</YStack>
			)}

			<YStack flex={1} gap='$0.5'>
				<SizableText size='$3' fontWeight='600' numberOfLines={1}>
					{download.title ??
						download.item.Name ??
						download.item.SortName ??
						'Unknown track'}
				</SizableText>
				<SizableText size='$1' color='$borderColor' numberOfLines={1}>
					{download.album ?? 'Unknown album'} · {formatBytes(getDownloadSize(download))}
				</SizableText>
				<SizableText size='$1' color='$borderColor'>
					Saved {formatSavedAt(download.savedAt)}
				</SizableText>
			</YStack>

			<Button
				size='$2'
				circular
				backgroundColor='transparent'
				hitSlop={10}
				icon={<Icon name='broom' color='$warning' small />}
				onPress={(event) => {
					event.stopPropagation()
					onDelete()
				}}
			/>
		</XStack>
	</Pressable>
)
