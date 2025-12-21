import React, { useState } from 'react'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, Alert } from 'react-native'
import { Card, Paragraph, Separator, SizableText, Spinner, XStack, YStack, Image } from 'tamagui'

import { useStorageContext, CleanupSuggestion } from '../../../providers/Storage'
import Icon from '../../../components/Global/components/icon'
import Button from '../../../components/Global/helpers/button'
import { formatBytes } from '../../../utils/format-bytes'
import { JellifyDownload, JellifyDownloadProgress } from '../../../types/JellifyDownload'
import { useDeletionToast } from './useDeletionToast'
import { Text } from '../../../components/Global/helpers/text'

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
	} = useStorageContext()

	const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null)

	const insets = useSafeAreaInsets()

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

	const renderDownloadItem: ListRenderItem<JellifyDownload> = ({ item }) => (
		<DownloadRow
			download={item}
			isSelected={Boolean(selection[item.item.Id as string])}
			onToggle={() => toggleSelection(item.item.Id as string)}
			onDelete={() => {
				void handleDeleteSingle(item)
			}}
		/>
	)

	const topPadding = 16

	return (
		<YStack flex={1} backgroundColor={'$background'}>
			<FlashList
				data={sortedDownloads}
				keyExtractor={(item) =>
					item.item.Id ?? item.url ?? item.title ?? Math.random().toString()
				}
				contentContainerStyle={{
					paddingBottom: insets.bottom + 48,
					paddingHorizontal: 16,
					paddingTop: topPadding,
				}}
				ItemSeparatorComponent={Separator}
				ListHeaderComponent={
					<YStack gap='$4'>
						<XStack justifyContent='space-between' alignItems='center'>
							{selectedIds.length > 0 && (
								<Card
									paddingHorizontal='$3'
									paddingVertical='$2'
									borderRadius='$4'
									backgroundColor='$backgroundFocus'
								>
									<Paragraph fontWeight='600'>
										{selectedIds.length} selected
									</Paragraph>
								</Card>
							)}
						</XStack>
						<StorageSummaryCard
							summary={summary}
							refreshing={refreshing}
							onRefresh={() => {
								void refresh()
							}}
							activeDownloadsCount={activeDownloadsCount}
							activeDownloads={activeDownloads}
							onDeleteAll={handleDeleteAll}
						/>
						<CleanupSuggestionsRow
							suggestions={suggestions}
							onApply={(suggestion) => {
								void handleApplySuggestion(suggestion)
							}}
							busySuggestionId={applyingSuggestionId}
						/>
						<DownloadsSectionHeading count={downloads?.length ?? 0} />
						{selectedIds.length > 0 && (
							<SelectionReviewBanner
								selectedCount={selectedIds.length}
								selectedBytes={selectedBytes}
								onDelete={handleDeleteSelection}
								onClear={clearSelection}
							/>
						)}
					</YStack>
				}
				ListEmptyComponent={
					<EmptyState
						refreshing={refreshing}
						onRefresh={() => {
							void refresh()
						}}
					/>
				}
				renderItem={renderDownloadItem}
			/>
		</YStack>
	)
}

const StorageSummaryCard = ({
	summary,
	refreshing,
	onRefresh,
	activeDownloadsCount,
	activeDownloads,
	onDeleteAll,
}: {
	summary: ReturnType<typeof useStorageContext>['summary']
	refreshing: boolean
	onRefresh: () => void
	activeDownloadsCount: number
	activeDownloads: JellifyDownloadProgress | undefined
	onDeleteAll: () => void
}) => {
	return (
		<Card
			backgroundColor={'$backgroundFocus'}
			padding='$4'
			borderRadius='$6'
			borderWidth={1}
			borderColor={'$borderColor'}
		>
			<XStack justifyContent='space-between' alignItems='center' marginBottom='$3'>
				<SizableText size='$5' fontWeight='600'>
					Storage overview
				</SizableText>
				<XStack gap='$2'>
					<Button
						size='$2'
						circular
						backgroundColor='transparent'
						hitSlop={10}
						icon={() =>
							refreshing ? (
								<Spinner size='small' color='$color' />
							) : (
								<Icon name='refresh' color='$color' />
							)
						}
						onPress={onRefresh}
						aria-label='Refresh storage overview'
					/>
					<Button
						size='$2'
						backgroundColor='$warning'
						borderColor='$warning'
						borderWidth={1}
						color='white'
						onPress={onDeleteAll}
						icon={() => <Icon name='broom' color='$background' small />}
					>
						<Text bold color={'$background'}>
							Clear All
						</Text>
					</Button>
				</XStack>
			</XStack>
			{summary ? (
				<YStack gap='$4'>
					<YStack gap='$1'>
						<SizableText size='$8' fontWeight='700'>
							{formatBytes(summary.usedByDownloads)}
						</SizableText>
						<Paragraph color='$borderColor'>
							Used by offline music · {formatBytes(summary.freeSpace)} free on device
						</Paragraph>
					</YStack>
					<YStack gap='$2'>
						<ProgressBar progress={summary.usedPercentage} />
						<Paragraph color='$borderColor'>
							{summary.downloadCount} downloads · {summary.manualDownloadCount} manual
							· {summary.autoDownloadCount} auto
						</Paragraph>
					</YStack>
					<StatGrid summary={summary} />
				</YStack>
			) : (
				<YStack gap='$2'>
					<Spinner />
					<Paragraph color='$borderColor'>Calculating storage usage…</Paragraph>
				</YStack>
			)}
		</Card>
	)
}

const ProgressBar = ({ progress }: { progress: number }) => (
	<YStack height={10} borderRadius={999} backgroundColor={'$backgroundHover'}>
		<YStack
			height={10}
			borderRadius={999}
			backgroundColor={'$primary'}
			width={`${Math.min(1, Math.max(0, progress)) * 100}%`}
		/>
	</YStack>
)

const CleanupSuggestionsRow = ({
	suggestions,
	onApply,
	busySuggestionId,
}: {
	suggestions: CleanupSuggestion[]
	onApply: (suggestion: CleanupSuggestion) => void
	busySuggestionId: string | null
}) => {
	if (!suggestions.length) return null

	return (
		<YStack gap='$3'>
			<SizableText size='$5' fontWeight='600'>
				Cleanup ideas
			</SizableText>
			<XStack gap='$3' flexWrap='wrap'>
				{suggestions.map((suggestion) => (
					<Card
						key={suggestion.id}
						padding='$3'
						borderRadius='$4'
						backgroundColor={'$backgroundFocus'}
						borderWidth={1}
						borderColor={'$borderColor'}
						flexGrow={1}
						flexBasis='48%'
					>
						<YStack gap='$2'>
							<SizableText size='$4' fontWeight='600'>
								{suggestion.title}
							</SizableText>
							<Paragraph color='$borderColor'>
								{suggestion.count} items · {formatBytes(suggestion.freedBytes)}
							</Paragraph>
							<Paragraph color='$borderColor'>{suggestion.description}</Paragraph>
							<Button
								size='$3'
								width='100%'
								backgroundColor='$primary'
								borderColor='$primary'
								borderWidth={1}
								color='$background'
								disabled={busySuggestionId === suggestion.id}
								icon={() =>
									busySuggestionId === suggestion.id ? (
										<Spinner size='small' color='$background' />
									) : (
										<Icon name='broom' color='$background' />
									)
								}
								onPress={() => onApply(suggestion)}
							>
								Free {formatBytes(suggestion.freedBytes)}
							</Button>
						</YStack>
					</Card>
				))}
			</XStack>
		</YStack>
	)
}

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
		<XStack padding='$3' alignItems='center' gap='$3' borderRadius='$4'>
			<Icon
				name={isSelected ? 'check-circle-outline' : 'circle-outline'}
				color={isSelected ? '$color' : '$borderColor'}
			/>

			{download.artwork ? (
				<Image
					source={{ uri: download.artwork, width: 50, height: 50 }}
					width={50}
					height={50}
					borderRadius='$2'
				/>
			) : (
				<YStack
					width={50}
					height={50}
					borderRadius='$2'
					backgroundColor='$backgroundHover'
					alignItems='center'
					justifyContent='center'
				>
					<Icon name='music-note' color='$color' />
				</YStack>
			)}

			<YStack flex={1} gap='$1'>
				<SizableText size='$4' fontWeight='600'>
					{download.title ??
						download.item.Name ??
						download.item.SortName ??
						'Unknown track'}
				</SizableText>
				<Paragraph color='$borderColor'>
					{download.album ?? 'Unknown album'} · {formatBytes(getDownloadSize(download))}
				</Paragraph>
				<Paragraph color='$borderColor'>Saved {formatSavedAt(download.savedAt)}</Paragraph>
			</YStack>
			<Button
				size='$3'
				circular
				backgroundColor='transparent'
				hitSlop={10}
				icon={() => <Icon name='broom' color='$warning' />}
				onPress={(event) => {
					event.stopPropagation()
					onDelete()
				}}
				aria-label='Clear download'
			/>
		</XStack>
	</Pressable>
)

const EmptyState = ({ refreshing, onRefresh }: { refreshing: boolean; onRefresh: () => void }) => (
	<YStack padding='$6' alignItems='center' gap='$3'>
		<SizableText size='$6' fontWeight='600'>
			No offline music yet
		</SizableText>
		<Paragraph color='$borderColor' textAlign='center'>
			Downloaded tracks will show up here so you can reclaim storage any time.
		</Paragraph>
		<Button
			borderColor='$borderColor'
			borderWidth={1}
			backgroundColor='$background'
			onPress={onRefresh}
			icon={() =>
				refreshing ? (
					<Spinner size='small' color='$borderColor' />
				) : (
					<Icon name='refresh' color='$borderColor' />
				)
			}
		>
			Refresh
		</Button>
	</YStack>
)

const SelectionReviewBanner = ({
	selectedCount,
	selectedBytes,
	onDelete,
	onClear,
}: {
	selectedCount: number
	selectedBytes: number
	onDelete: () => void
	onClear: () => void
}) => (
	<Card
		borderRadius='$6'
		borderWidth={1}
		borderColor='$borderColor'
		backgroundColor='$backgroundFocus'
		padding='$3'
	>
		<YStack gap='$3'>
			<XStack justifyContent='space-between' alignItems='center'>
				<YStack>
					<SizableText size='$5' fontWeight='600'>
						Ready to clean up?
					</SizableText>
					<Paragraph color='$borderColor'>
						{selectedCount} {selectedCount === 1 ? 'track' : 'tracks'} ·{' '}
						{formatBytes(selectedBytes)}
					</Paragraph>
				</YStack>
				<Button
					size='$2'
					borderColor='$borderColor'
					borderWidth={1}
					backgroundColor='$background'
					onPress={onClear}
				>
					Clear
				</Button>
			</XStack>
			<Button
				size='$3'
				borderColor='$warning'
				borderWidth={1}
				color='white'
				icon={() => <Icon small name='broom' color='$warning' />}
				onPress={onDelete}
			>
				<Text bold color={'$warning'}>{`Clear ${formatBytes(selectedBytes)}`}</Text>
			</Button>
		</YStack>
	</Card>
)

const DownloadsSectionHeading = ({ count }: { count: number }) => (
	<XStack alignItems='center' justifyContent='space-between'>
		<SizableText size='$5' fontWeight='600'>
			Offline library
		</SizableText>
		<Paragraph color='$borderColor'>
			{count} {count === 1 ? 'item' : 'items'} cached
		</Paragraph>
	</XStack>
)

const StatGrid = ({
	summary,
}: {
	summary: NonNullable<ReturnType<typeof useStorageContext>['summary']>
}) => (
	<XStack gap='$3' flexWrap='wrap'>
		<StatChip label='Audio files' value={formatBytes(summary.audioBytes)} />
		<StatChip label='Artwork' value={formatBytes(summary.artworkBytes)} />
		<StatChip label='Auto downloads' value={`${summary.autoDownloadCount}`} />
	</XStack>
)

const StatChip = ({ label, value }: { label: string; value: string }) => (
	<YStack
		flexGrow={1}
		flexBasis='30%'
		minWidth={110}
		borderWidth={1}
		borderColor='$borderColor'
		borderRadius='$4'
		padding='$3'
		backgroundColor={'$background'}
	>
		<SizableText size='$6' fontWeight='700'>
			{value}
		</SizableText>
		<Paragraph color='$borderColor'>{label}</Paragraph>
	</YStack>
)
