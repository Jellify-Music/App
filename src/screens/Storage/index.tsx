import React, { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, Alert } from 'react-native'
import { Card, RadioGroup, SizableText, Spinner, XStack, YStack, Image } from 'tamagui'

import { useStorageContext, CleanupSuggestion } from '../../providers/Storage'
import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/helpers/button'
import SettingsSection from '../../components/Settings/components/settings-section'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/helpers/radio-group-item-with-label'
import { formatBytes } from '../../utils/formatting/bytes'
import { useDeletionToast } from '../../utils/toasts/deletion-toast'
import { DownloadQuality, useAutoDownload, useDownloadQuality } from '../../stores/settings/usage'
import {
	DownloadedTrack,
	DownloadProgress,
} from 'react-native-nitro-player/lib/types/DownloadTypes'
import useDownloads from '../../hooks/downloads'
import { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { useDownloadProgress } from 'react-native-nitro-player'
import { StorageManagementProps } from '../Settings/types'
import { LegendList, LegendListRenderItemProps } from '@legendapp/list/react-native'

const getDownloadSize = (download: DownloadedTrack) => download.fileSize ?? 0

export default function StorageManagementScreen({
	navigation,
}: StorageManagementProps): React.JSX.Element {
	const { summary, suggestions, selection, toggleSelection, clearSelection, refresh } =
		useStorageContext()

	const { data: downloads } = useDownloads()

	const { progressList } = useDownloadProgress()

	const { mutateAsync: deleteDownloads } = useDeleteDownloads()

	const [autoDownload, setAutoDownload] = useAutoDownload()
	const [downloadQuality, setDownloadQuality] = useDownloadQuality()

	const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null)

	const insets = useSafeAreaInsets()

	const showDeletionToast = useDeletionToast()

	const sortedDownloads = !downloads
		? []
		: [...downloads].sort(
				(a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime(),
			)

	const selectedIds = Object.entries(selection)
		.filter(([, isSelected]) => isSelected)
		.map(([id]) => id)
	const selectedIdSet = new Set(selectedIds)

	const selectedBytes =
		!selectedIds.length || !downloads
			? 0
			: downloads.reduce((total, download) => {
					return selectedIdSet.has(download.trackId)
						? total + getDownloadSize(download)
						: total
				}, 0)

	const handleApplySuggestion = async (suggestion: CleanupSuggestion) => {
		if (!suggestion.itemIds.length) return
		setApplyingSuggestionId(suggestion.id)
		try {
			await deleteDownloads(suggestion.itemIds)
			showDeletionToast(`Removed ${suggestion.itemIds.length} downloads`, 0)
		} finally {
			setApplyingSuggestionId(null)
		}
	}

	const handleDeleteSingle = async (download: DownloadedTrack) => {
		await deleteDownloads([download.trackId])
		showDeletionToast(
			`Removed ${download.originalTrack.title ?? 'track'}`,
			download.fileSize ?? 0,
		)
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
						const allIds = downloads.map((d) => d.trackId)
						const totalBytes = downloads.reduce(
							(total, download) => total + getDownloadSize(download),
							0,
						)
						await deleteDownloads(allIds)
						showDeletionToast(`Removed ${allIds.length} downloads`, totalBytes)
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
						await deleteDownloads(selectedIds)
						showDeletionToast(`Removed ${selectedIds.length} downloads`, selectedBytes)
						clearSelection()
					},
				},
			],
		)

	const renderDownloadItem = ({ item }: LegendListRenderItemProps<DownloadedTrack>) => (
		<DownloadRow
			download={item}
			isSelected={Boolean(selection[item.trackId])}
			onToggle={() => toggleSelection(item.trackId)}
			onDelete={() => {
				void handleDeleteSingle(item)
			}}
		/>
	)

	const topPadding = 16

	return (
		<YStack flex={1} backgroundColor='background' testID='settings-screen-storage'>
			<LegendList
				data={sortedDownloads}
				keyExtractor={(item, index) =>
					item.trackId ?? item.originalTrack.url ?? item.originalTrack.title ?? index
				}
				contentContainerStyle={{
					paddingBottom: insets.bottom + 48,
					paddingHorizontal: 16,
					paddingTop: topPadding,
				}}
				ListHeaderComponent={
					<YStack gap='4'>
						<XStack justifyContent='space-between' alignItems='center'>
							{selectedIds.length > 0 && (
								<Card
									paddingHorizontal='3'
									paddingVertical='2'
									borderRadius='4'
									backgroundColor='background75'
								>
									<SizableText fontSize='2' fontWeight='6'>
										{selectedIds.length} selected
									</SizableText>
								</Card>
							)}
						</XStack>
						<StorageSummaryCard
							summary={summary}
							onRefresh={() => {
								void refresh()
							}}
							activeDownloadsCount={
								progressList ? Object.keys(progressList).length : 0
							}
							activeDownloads={progressList}
							onDeleteAll={handleDeleteAll}
						/>
						<DownloadSettingsSection
							autoDownload={autoDownload}
							setAutoDownload={setAutoDownload}
							downloadQuality={downloadQuality}
							setDownloadQuality={setDownloadQuality}
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
	onRefresh,
	onDeleteAll,
}: {
	summary: ReturnType<typeof useStorageContext>['summary']
	onRefresh: () => void
	activeDownloadsCount: number
	activeDownloads: DownloadProgress[] | undefined
	onDeleteAll: () => void
}) => {
	return (
		<Card
			backgroundColor='background75'
			padding='4'
			borderRadius='6'
			borderWidth={'1'}
			borderColor='borderColor'
		>
			<XStack justifyContent='space-between' alignItems='center' marginBottom='3'>
				<SizableText size='2' fontWeight='6'>
					Storage overview
				</SizableText>
				<XStack gap='2'>
					<Icon
						size='6'
						name='refresh'
						color='color'
						onPress={onRefresh}
						aria-label='Refresh storage overview'
					/>
					<Button
						backgroundColor='warning'
						borderColor='warning'
						borderWidth={1}
						onPress={onDeleteAll}
						icon={() => <Icon name='broom' color='background' size='7' />}
					>
						<SizableText fontSize='2' fontWeight='6' color='background'>
							Clear All
						</SizableText>
					</Button>
				</XStack>
			</XStack>
			{summary ? (
				<YStack gap='4'>
					<YStack gap='1'>
						<SizableText size='2' fontWeight='8'>
							{formatBytes(summary.usedByDownloads)}
						</SizableText>
						<SizableText fontSize='2' color='borderColor'>
							Used by offline music · {formatBytes(summary.freeSpace)} free on device
						</SizableText>
					</YStack>
					<YStack gap='2'>
						<ProgressBar progress={summary.usedPercentage} />
						<SizableText fontSize='2' color='borderColor'>
							{summary.downloadCount} downloads
						</SizableText>
					</YStack>
					<StatGrid summary={summary} />
				</YStack>
			) : (
				<YStack gap='2'>
					<Spinner />
					<SizableText fontSize='2' color='borderColor'>
						Calculating storage usage…
					</SizableText>
				</YStack>
			)}
		</Card>
	)
}

const ProgressBar = ({ progress }: { progress: number }) => (
	<YStack height={10} borderRadius={999} backgroundColor='background75'>
		<YStack
			height={10}
			borderRadius={999}
			backgroundColor='primary'
			width={`${Math.min(1, Math.max(0, progress)) * 100}%`}
		/>
	</YStack>
)

const DownloadRow = ({
	download,
	isSelected,
	onToggle,
	onDelete,
}: {
	download: DownloadedTrack
	isSelected: boolean
	onToggle: () => void
	onDelete: () => void
}) => (
	<Pressable onPress={onToggle} accessibilityRole='button'>
		<XStack padding='3' alignItems='center' gap='3' borderRadius='4'>
			<Icon
				name={isSelected ? 'check-circle-outline' : 'circle-outline'}
				color={isSelected ? 'color' : 'borderColor'}
			/>

			{download.localArtworkPath ? (
				<Image
					source={{ uri: download.localArtworkPath, width: 50, height: 50 }}
					width={50}
					height={50}
					borderRadius='2'
				/>
			) : (
				<YStack
					width={50}
					height={50}
					borderRadius='2'
					backgroundColor='background75'
					alignItems='center'
					justifyContent='center'
				>
					<Icon name='music-note' color='color' />
				</YStack>
			)}

			<YStack flex={1} gap='1'>
				<SizableText size='4' fontWeight='6'>
					{download.originalTrack.title ?? 'Unknown track'}
				</SizableText>
				<SizableText fontSize='2' color='borderColor'>
					{download.originalTrack.album ?? 'Unknown album'} ·{' '}
					{formatBytes(getDownloadSize(download))}
				</SizableText>
			</YStack>
			<Button
				size='sm'
				circular
				backgroundColor='transparent'
				hitSlop={10}
				icon={() => <Icon name='broom' color='warning' />}
				onPress={(event) => {
					event.stopPropagation()
					onDelete()
				}}
				aria-label='Clear download'
			/>
		</XStack>
	</Pressable>
)

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
	<YStack padding='6' alignItems='center' gap='3'>
		<SizableText size='6' fontWeight='6'>
			No offline music yet
		</SizableText>
		<SizableText fontSize='2' color='borderColor' textAlign='center'>
			Downloaded tracks will show up here so you can reclaim storage any time.
		</SizableText>
		<Button
			borderColor='borderColor'
			borderWidth={1}
			backgroundColor='background'
			onPress={onRefresh}
			icon={<Icon name='refresh' color='borderColor' />}
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
		borderRadius='6'
		borderWidth={1}
		borderColor='borderColor'
		backgroundColor='background75'
		padding='3'
	>
		<YStack gap='3'>
			<XStack justifyContent='space-between' alignItems='center'>
				<YStack>
					<SizableText size='2' fontWeight='6'>
						Ready to clean up?
					</SizableText>
					<SizableText fontSize='2' color='borderColor'>
						{selectedCount} {selectedCount === 1 ? 'track' : 'tracks'} ·{' '}
						{formatBytes(selectedBytes)}
					</SizableText>
				</YStack>
				<Button
					borderColor='borderColor'
					borderWidth={1}
					backgroundColor='background'
					onPress={onClear}
				>
					Clear
				</Button>
			</XStack>
			<Button
				size='sm'
				borderColor='warning'
				borderWidth={1}
				icon={() => <Icon size='7' name='broom' color='warning' />}
				onPress={onDelete}
			>
				<SizableText fontSize='2' fontWeight='6' color='warning'>
					{`Clear ${formatBytes(selectedBytes)}`}
				</SizableText>
			</Button>
		</YStack>
	</Card>
)

const DownloadsSectionHeading = ({ count }: { count: number }) => (
	<XStack alignItems='center' justifyContent='space-between'>
		<SizableText size='2' fontWeight='2'>
			Offline library
		</SizableText>
		<SizableText fontSize='2' color='borderColor'>
			{count} {count === 1 ? 'item' : 'items'} cached
		</SizableText>
	</XStack>
)

const StatGrid = ({
	summary,
}: {
	summary: NonNullable<ReturnType<typeof useStorageContext>['summary']>
}) => (
	<XStack gap='3' flexWrap='wrap'>
		<StatChip label='Audio files' value={formatBytes(summary.audioBytes)} />
	</XStack>
)

const StatChip = ({ label, value }: { label: string; value: string }) => (
	<YStack
		flexGrow={1}
		flexBasis='30%'
		minWidth={110}
		borderWidth={1}
		borderColor='borderColor'
		borderRadius='4'
		padding='3'
		backgroundColor='background'
	>
		<SizableText size='2' fontWeight='8'>
			{value}
		</SizableText>
		<SizableText fontSize='2' color='borderColor'>
			{label}
		</SizableText>
	</YStack>
)

const DownloadSettingsSection = ({
	autoDownload,
	setAutoDownload,
	downloadQuality,
	setDownloadQuality,
}: {
	autoDownload: boolean
	setAutoDownload: (value: boolean) => void
	downloadQuality: DownloadQuality
	setDownloadQuality: (value: DownloadQuality) => void
}) => (
	<SettingsSection title='Download Settings' icon='cog' iconColor='primary' defaultExpanded>
		<XStack alignItems='center' justifyContent='space-between'>
			<YStack flex={1}>
				<SizableText fontSize='2' fontWeight={'6'}>
					Auto-Download Tracks
				</SizableText>
				<SizableText fontSize='2' color='borderColor'>
					Download tracks as they are played
				</SizableText>
			</YStack>
			<SwitchWithLabel checked={autoDownload} onCheckedChange={setAutoDownload} size='2' />
		</XStack>

		<YStack>
			<SizableText size='2' fontWeight={'6'}>
				Download Quality
			</SizableText>
			<SizableText size='2' color='borderColor'>
				Quality used when downloading tracks
			</SizableText>
			<RadioGroup
				marginTop='2'
				value={downloadQuality}
				onValueChange={(value) => setDownloadQuality(value as DownloadQuality)}
			>
				<RadioGroupItemWithLabel size='3' value='original' label='Original Quality' />
				<RadioGroupItemWithLabel size='3' value='high' label='High (320kbps)' />
				<RadioGroupItemWithLabel size='3' value='medium' label='Medium (192kbps)' />
				<RadioGroupItemWithLabel size='3' value='low' label='Low (128kbps)' />
			</RadioGroup>
		</YStack>
	</SettingsSection>
)
