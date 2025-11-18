import React, { useCallback, useMemo, useState } from 'react'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable } from 'react-native'
import { Card, Checkbox, Paragraph, Separator, SizableText, Spinner, XStack, YStack } from 'tamagui'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useStorageContext, CleanupSuggestion } from '../../../providers/Storage'
import Icon from '../../../components/Global/components/icon'
import Button from '../../../components/Global/helpers/button'
import { formatBytes } from '../../../utils/format-bytes'
import { JellifyDownload } from '../../../types/JellifyDownload'
import { SettingsStackParamList } from '../types'
import { useDeletionToast } from './useDeletionToast'

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
	} = useStorageContext()

	const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null)

	const insets = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()
	const showDeletionToast = useDeletionToast()

	useFocusEffect(
		useCallback(() => {
			void refresh()
		}, [refresh]),
	)

	const sortedDownloads = useMemo(() => {
		if (!downloads) return []
		return [...downloads].sort(
			(a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
		)
	}, [downloads])

	const selectedIds = useMemo(
		() =>
			Object.entries(selection)
				.filter(([, isSelected]) => isSelected)
				.map(([id]) => id),
		[selection],
	)

	const selectedBytes = useMemo(() => {
		if (!selectedIds.length || !downloads) return 0
		const selectedSet = new Set(selectedIds)
		return downloads.reduce((total, download) => {
			return selectedSet.has(download.item.Id as string)
				? total + getDownloadSize(download)
				: total
		}, 0)
	}, [downloads, selectedIds])

	const handleApplySuggestion = useCallback(
		async (suggestion: CleanupSuggestion) => {
			if (!suggestion.itemIds.length) return
			setApplyingSuggestionId(suggestion.id)
			try {
				const result = await deleteDownloads(suggestion.itemIds)
				if (result?.deletedCount)
					showDeletionToast(`Removed ${result.deletedCount} downloads`, result.freedBytes)
			} finally {
				setApplyingSuggestionId(null)
			}
		},
		[deleteDownloads, showDeletionToast],
	)

	const handleDeleteSingle = useCallback(
		async (download: JellifyDownload) => {
			const result = await deleteDownloads([download.item.Id as string])
			if (result?.deletedCount)
				showDeletionToast(`Removed ${download.title ?? 'track'}`, result.freedBytes)
		},
		[deleteDownloads, showDeletionToast],
	)

	const renderDownloadItem: ListRenderItem<JellifyDownload> = useCallback(
		({ item }) => (
			<DownloadRow
				download={item}
				isSelected={Boolean(selection[item.item.Id as string])}
				onToggle={() => toggleSelection(item.item.Id as string)}
				onDelete={() => {
					void handleDeleteSingle(item)
				}}
			/>
		),
		[selection, toggleSelection, handleDeleteSingle],
	)

	const topPadding = Math.max(insets.top, 12) + 8

	return (
		<YStack flex={1} backgroundColor={'$background'}>
			<FlashList
				data={sortedDownloads}
				keyExtractor={(item) =>
					item.item.Id ?? item.url ?? item.title ?? Math.random().toString()
				}
				maintainVisibleContentPosition={{
					autoscrollToTopThreshold: Number.MAX_SAFE_INTEGER,
				}}
				contentContainerStyle={{
					paddingBottom: insets.bottom + 48,
					paddingHorizontal: 16,
					paddingTop: topPadding,
				}}
				ItemSeparatorComponent={Separator}
				ListHeaderComponent={
					<YStack gap='$4'>
						<ScreenHeader
							onBack={() => navigation.goBack()}
							selectionCount={selectedIds.length}
						/>
						<StorageSummaryCard
							summary={summary}
							refreshing={refreshing}
							onRefresh={() => {
								void refresh()
							}}
							activeDownloadsCount={activeDownloadsCount}
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
								onReview={() => navigation.navigate('StorageSelectionReview')}
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
}: {
	summary: ReturnType<typeof useStorageContext>['summary']
	refreshing: boolean
	onRefresh: () => void
	activeDownloadsCount: number
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
					accessibilityLabel='Refresh storage overview'
				/>
			</XStack>
			{summary ? (
				<YStack gap='$4'>
					<YStack gap='$1'>
						<SizableText size='$8' fontWeight='700'>
							{formatBytes(summary.usedByDownloads)}
						</SizableText>
						<Paragraph color='$borderColor'>
							Used by offline music · {formatBytes(summary.totalSpace)} available on
							device
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
					{activeDownloadsCount > 0 && (
						<Card
							backgroundColor={'$background'}
							padding='$3'
							borderRadius='$4'
							borderWidth={1}
							borderColor='$borderColor'
						>
							<XStack alignItems='center' gap='$2'>
								<Icon name='arrow-down-circle' color='$primary' />
								<Paragraph>
									{activeDownloadsCount} active{' '}
									{activeDownloadsCount === 1 ? 'download' : 'downloads'}
								</Paragraph>
							</XStack>
						</Card>
					)}
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
			<Checkbox size='$4' checked={isSelected} onCheckedChange={onToggle}>
				<Checkbox.Indicator>
					<Icon name='check' color='$primary' />
				</Checkbox.Indicator>
			</Checkbox>
			<YStack flex={1} gap='$1'>
				<SizableText size='$4' fontWeight='600'>
					{download.title ?? download.item.SortName ?? 'Unknown track'}
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
				icon={() => <Icon name='delete-outline' color='$danger' />}
				onPress={(event) => {
					event.stopPropagation()
					onDelete()
				}}
				accessibilityLabel='Delete download'
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

const ScreenHeader = ({
	onBack,
	selectionCount,
}: {
	onBack: () => void
	selectionCount: number
}) => (
	<XStack justifyContent='space-between' alignItems='center' gap='$3'>
		<Button
			size='$2'
			borderColor='$borderColor'
			borderWidth={1}
			backgroundColor='$background'
			icon={() => <Icon name='chevron-left' color='$color' />}
			onPress={onBack}
		>
			Back
		</Button>
		<YStack flex={1} gap='$1'>
			<SizableText size='$7' fontWeight='700'>
				Offline storage
			</SizableText>
			<Paragraph color='$borderColor'>Manage downloaded music and free space</Paragraph>
		</YStack>
		{selectionCount > 0 && (
			<Card
				paddingHorizontal='$3'
				paddingVertical='$2'
				borderRadius='$4'
				backgroundColor='$backgroundFocus'
			>
				<Paragraph fontWeight='600'>{selectionCount} selected</Paragraph>
			</Card>
		)}
	</XStack>
)

const SelectionReviewBanner = ({
	selectedCount,
	selectedBytes,
	onReview,
	onClear,
}: {
	selectedCount: number
	selectedBytes: number
	onReview: () => void
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
				backgroundColor='$primary'
				borderColor='$primary'
				borderWidth={1}
				color='$background'
				icon={() => <Icon name='eye' color='$background' />}
				onPress={onReview}
			>
				Review selection
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
