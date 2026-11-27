import React, { useState } from 'react'
import type { EventHandler } from '../../types/Events'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Pressable, Alert } from 'react-native'
import { Card, RadioGroup, SizableText, Spinner, XStack, YStack, Image } from 'tamagui'

import { useStorageContext, CleanupSuggestion } from '../../providers/Storage'
import Icon from '../../components/Global/components/icon'
import Button from '../../components/Global/utils/button'
import SettingsSection from '../../components/Settings/components/settings-section'
import { SwitchWithLabel } from '../../components/Global/utils/switch-with-label'
import { RadioGroupItemWithLabel } from '../../components/Global/utils/radio-group-item-with-label'
import { formatBytes } from '../../utils/formatting/bytes'
import { useDeletionToast } from '../../utils/toasts/deletion-toast'
import { useAutoDownload, useDownloadQuality } from '../../stores/settings/usage'
import {
	DownloadedTrack,
	DownloadProgress,
} from 'react-native-nitro-player/lib/types/DownloadTypes'
import useDownloads from '../../hooks/downloads'
import { useDeleteDownloads } from '../../hooks/downloads/mutations'
import { useDownloadProgress } from 'react-native-nitro-player'
import { LegendList, LegendListRenderItemProps } from '@legendapp/list/react-native'
import { DownloadQuality } from '../../enums/audio-quality'
import { useTranslation } from 'react-i18next'
import DownloadingList from '../../components/Downloads/downloading-list'
import { useDownloadingAlbums } from '../../hooks/downloads/queue'

const getDownloadSize = (download: DownloadedTrack) => download.fileSize ?? 0

export default function StorageManagementScreen(): React.JSX.Element {
	const { t } = useTranslation()

	const { summary, selection, toggleSelection, clearSelection, refresh } = useStorageContext()

	const { data: downloads } = useDownloads()

	const { progressList } = useDownloadProgress()

	const downloadingAlbums = useDownloadingAlbums()

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
			showDeletionToast(
				t('storage.removedDownloads', { count: suggestion.itemIds.length }),
				0,
			)
		} finally {
			setApplyingSuggestionId(null)
		}
	}

	const handleDeleteSingle = async (download: DownloadedTrack) => {
		await deleteDownloads([download.trackId])
		showDeletionToast(
			t('storage.removedTrack', { name: download.originalTrack.title ?? t('storage.track') }),
			download.fileSize ?? 0,
		)
	}

	const handleDeleteAll = () =>
		Alert.alert(t('storage.clearAllTitle'), t('storage.clearAllMessage'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('storage.clearAll'),
				style: 'destructive',
				onPress: async () => {
					if (!downloads) return
					const allIds = downloads.map((d) => d.trackId)
					const totalBytes = downloads.reduce(
						(total, download) => total + getDownloadSize(download),
						0,
					)
					await deleteDownloads(allIds)
					showDeletionToast(
						t('storage.removedDownloads', { count: allIds.length }),
						totalBytes,
					)
				},
			},
		])

	const handleDeleteSelection = () =>
		Alert.alert(
			t('storage.clearSelectedTitle'),
			t('storage.clearSelectedMessage', { count: selectedIds.length }),
			[
				{ text: t('common.cancel'), style: 'cancel' },
				{
					text: t('common.clear'),
					style: 'destructive',
					onPress: async () => {
						await deleteDownloads(selectedIds)
						showDeletionToast(
							t('storage.removedDownloads', { count: selectedIds.length }),
							selectedBytes,
						)
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
										{t('storage.selectedCount', { count: selectedIds.length })}
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
						{downloadingAlbums.length > 0 && (
							<YStack gap='3' testID='storage-downloading'>
								<SizableText size='2' fontWeight='6'>
									{t('downloads.downloading')}
								</SizableText>

								<DownloadingList groups={downloadingAlbums} />
							</YStack>
						)}
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
	onRefresh: EventHandler
	activeDownloadsCount: number
	activeDownloads: DownloadProgress[] | undefined
	onDeleteAll: EventHandler
}) => {
	const { t } = useTranslation()

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
					{t('storage.overview')}
				</SizableText>
				<XStack gap='2'>
					<Icon
						size='6'
						name='refresh'
						color='color'
						onPress={onRefresh}
						aria-label={t('storage.refreshOverview')}
					/>
					<Button
						backgroundColor='warning'
						borderColor='warning'
						borderWidth={1}
						onPress={onDeleteAll}
						icon={() => <Icon name='broom' color='background' size='7' />}
					>
						<SizableText fontSize='2' fontWeight='6' color='background'>
							{t('storage.clearAll')}
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
							{t('storage.usage', { free: formatBytes(summary.freeSpace) })}
						</SizableText>
					</YStack>
					<YStack gap='2'>
						<ProgressBar progress={summary.usedPercentage} />
						<SizableText fontSize='2' color='borderColor'>
							{t('storage.downloadCount', { count: summary.downloadCount })}
						</SizableText>
					</YStack>
					<StatGrid summary={summary} />
				</YStack>
			) : (
				<YStack gap='2'>
					<Spinner />
					<SizableText fontSize='2' color='borderColor'>
						{t('storage.calculating')}
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
	onToggle: EventHandler
	onDelete: EventHandler
}) => {
	const { t } = useTranslation()

	return (
		<Pressable onPress={onToggle} accessibilityRole='button'>
			<XStack padding='3' alignItems='center' gap='3' borderRadius='4'>
				<Icon
					name={isSelected ? 'check-circle-outline' : 'circle-outline'}
					color={isSelected ? 'color' : 'borderColor'}
				/>

				{download.localArtworkPath ? (
					<Image
						src={download.localArtworkPath}
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
						{download.originalTrack.title ?? t('placeholders.unknownTrack')}
					</SizableText>
					<SizableText fontSize='2' color='borderColor'>
						{download.originalTrack.album ?? t('placeholders.unknownAlbum')} ·{' '}
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
					aria-label={t('storage.clearDownload')}
				/>
			</XStack>
		</Pressable>
	)
}

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => {
	const { t } = useTranslation()

	return (
		<YStack padding='6' alignItems='center' gap='3'>
			<SizableText size='6' fontWeight='6'>
				{t('storage.empty')}
			</SizableText>
			<SizableText fontSize='2' color='borderColor' textAlign='center'>
				{t('storage.emptyHint')}
			</SizableText>
			<Button
				borderColor='borderColor'
				borderWidth={1}
				backgroundColor='background'
				onPress={onRefresh}
				icon={<Icon name='refresh' color='borderColor' />}
			>
				{t('common.refresh')}
			</Button>
		</YStack>
	)
}

const SelectionReviewBanner = ({
	selectedCount,
	selectedBytes,
	onDelete,
	onClear,
}: {
	selectedCount: number
	selectedBytes: number
	onDelete: EventHandler
	onClear: EventHandler
}) => {
	const { t } = useTranslation()

	return (
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
							{t('storage.readyToCleanUp')}
						</SizableText>
						<SizableText fontSize='2' color='borderColor'>
							{t('storage.selectionSummary', {
								count: selectedCount,
								size: formatBytes(selectedBytes),
							})}
						</SizableText>
					</YStack>
					<Button
						borderColor='borderColor'
						borderWidth={1}
						backgroundColor='background'
						onPress={onClear}
					>
						{t('common.clear')}
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
						{t('storage.clearSize', { size: formatBytes(selectedBytes) })}
					</SizableText>
				</Button>
			</YStack>
		</Card>
	)
}

const DownloadsSectionHeading = ({ count }: { count: number }) => {
	const { t } = useTranslation()

	return (
		<XStack alignItems='center' justifyContent='space-between'>
			<SizableText size='2' fontWeight='2'>
				{t('storage.offlineLibrary')}
			</SizableText>
			<SizableText fontSize='2' color='borderColor'>
				{t('storage.cachedCount', { count })}
			</SizableText>
		</XStack>
	)
}

const StatGrid = ({
	summary,
}: {
	summary: NonNullable<ReturnType<typeof useStorageContext>['summary']>
}) => {
	const { t } = useTranslation()

	return (
		<XStack gap='3' flexWrap='wrap'>
			<StatChip label={t('storage.audioFiles')} value={formatBytes(summary.audioBytes)} />
		</XStack>
	)
}

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
}) => {
	const { t } = useTranslation()

	return (
		<SettingsSection
			title={t('storage.downloadSettings')}
			icon='cog'
			iconColor='primary'
			defaultExpanded
		>
			<XStack alignItems='center' justifyContent='space-between'>
				<YStack flex={1}>
					<SizableText fontSize='2' fontWeight={'6'}>
						{t('storage.autoDownload')}
					</SizableText>
					<SizableText fontSize='2' color='borderColor'>
						{t('storage.autoDownloadDescription')}
					</SizableText>
				</YStack>
				<SwitchWithLabel
					checked={autoDownload}
					onCheckedChange={setAutoDownload}
					size='2'
				/>
			</XStack>

			<YStack>
				<SizableText size='2' fontWeight={'6'}>
					{t('storage.downloadQuality')}
				</SizableText>
				<SizableText size='2' color='borderColor'>
					{t('storage.downloadQualityDescription')}
				</SizableText>
				<RadioGroup
					gap='3'
					marginTop='2'
					value={downloadQuality}
					onValueChange={(value) => setDownloadQuality(value as DownloadQuality)}
				>
					<RadioGroupItemWithLabel
						size='3'
						value='original'
						label={t('settings.quality.original')}
					/>
					<RadioGroupItemWithLabel
						size='3'
						value='high'
						label={t('settings.quality.high')}
					/>
					<RadioGroupItemWithLabel
						size='3'
						value='medium'
						label={t('settings.quality.medium')}
					/>
					<RadioGroupItemWithLabel
						size='3'
						value='low'
						label={t('settings.quality.low')}
					/>
				</RadioGroup>
			</YStack>
		</SettingsSection>
	)
}
