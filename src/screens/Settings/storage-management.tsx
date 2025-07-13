import React, { useState, useMemo } from 'react'
import { Alert, Platform } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { Card, Text, XStack, YStack, Checkbox, Button, Separator, H3, H4 } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNetworkContext } from '../../providers/Network'
import { JellifyDownload } from '../../types/JellifyDownload'
import Icon from '../../components/Global/components/icon'
import { formatBytes } from '../../helpers/format'
import JellifyTrack from '../../types/JellifyTrack'

interface DownloadItemProps {
	download: JellifyDownload
	isSelected: boolean
	onToggleSelect: (download: JellifyDownload) => void
}

const DownloadItem: React.FC<DownloadItemProps> = ({ download, isSelected, onToggleSelect }) => {
	const trackDuration = download.item.RunTimeTicks
		? Math.floor(download.item.RunTimeTicks / 10000000)
		: 0

	const formatDuration = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins}:${secs.toString().padStart(2, '0')}`
	}

	const getArtistName = () => {
		if (download.item.ArtistItems && download.item.ArtistItems.length > 0) {
			return download.item.ArtistItems.map((artist) => artist.Name).join(', ')
		}
		return download.item.AlbumArtist || 'Unknown Artist'
	}

	return (
		<Card
			elevate
			size='$4'
			backgroundColor='$background'
			borderColor='$borderColor'
			pressStyle={{ scale: 0.98 }}
			onPress={() => onToggleSelect(download)}
		>
			<Card.Header padding='$3'>
				<XStack alignItems='center' space='$3'>
					<Checkbox
						size='$4'
						checked={isSelected}
						onCheckedChange={() => onToggleSelect(download)}
					/>

					<YStack flex={1} space='$1'>
						<XStack alignItems='center' space='$2'>
							<Text
								fontSize='$4'
								fontWeight='600'
								color='$color'
								numberOfLines={1}
								flexShrink={1}
							>
								{download.item.Name}
							</Text>
							{download.isAutoDownloaded && (
								<Icon name='cloud-download' small color='$primary' />
							)}
						</XStack>

						<Text fontSize='$3' color='$gray11' numberOfLines={1}>
							{getArtistName()}
						</Text>

						{download.item.Album && (
							<Text fontSize='$3' color='$gray10' numberOfLines={1}>
								{download.item.Album}
							</Text>
						)}

						<XStack space='$2' alignItems='center'>
							<Text fontSize='$2' color='$gray9'>
								{formatDuration(trackDuration)}
							</Text>
							<Text fontSize='$2' color='$gray9'>
								• Downloaded {new Date(download.savedAt).toLocaleDateString()}
							</Text>
						</XStack>
					</YStack>
				</XStack>
			</Card.Header>
		</Card>
	)
}

export default function StorageManagementScreen(): React.JSX.Element {
	const { downloadedTracks, storageUsage, useRemoveMultipleDownloads, useClearAllDownloads } =
		useNetworkContext()

	const [selectedDownloads, setSelectedDownloads] = useState<Set<string>>(new Set())
	const [sortBy, setSortBy] = useState<'name' | 'date' | 'artist' | 'size'>('date')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

	const sortedDownloads = useMemo(() => {
		if (!downloadedTracks) return []

		return [...downloadedTracks].sort((a, b) => {
			let comparison = 0

			switch (sortBy) {
				case 'name':
					comparison = (a.item.Name || '').localeCompare(b.item.Name || '')
					break
				case 'date':
					comparison = new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
					break
				case 'artist': {
					const artistA = a.item.ArtistItems?.[0]?.Name || a.item.AlbumArtist || ''
					const artistB = b.item.ArtistItems?.[0]?.Name || b.item.AlbumArtist || ''
					comparison = artistA.localeCompare(artistB)
					break
				}
				case 'size': {
					// Approximate size based on duration and quality
					const sizeA = ((a.item.RunTimeTicks || 0) / 10000000) * 4 * 1024 // rough estimate
					const sizeB = ((b.item.RunTimeTicks || 0) / 10000000) * 4 * 1024
					comparison = sizeA - sizeB
					break
				}
			}

			return sortOrder === 'asc' ? comparison : -comparison
		})
	}, [downloadedTracks, sortBy, sortOrder])

	const toggleSelectDownload = (download: JellifyDownload) => {
		const newSelected = new Set(selectedDownloads)
		if (newSelected.has(download.item.Id!)) {
			newSelected.delete(download.item.Id!)
		} else {
			newSelected.add(download.item.Id!)
		}
		setSelectedDownloads(newSelected)
	}

	const selectAll = () => {
		if (selectedDownloads.size === downloadedTracks?.length) {
			setSelectedDownloads(new Set())
		} else {
			setSelectedDownloads(new Set(downloadedTracks?.map((d) => d.item.Id!) || []))
		}
	}

	const deleteSelectedDownloads = () => {
		if (selectedDownloads.size === 0) return

		const tracksToDelete =
			downloadedTracks?.filter((d) => selectedDownloads.has(d.item.Id!)) || []

		Alert.alert(
			'Delete Downloads',
			`Are you sure you want to delete ${selectedDownloads.size} downloaded ${
				selectedDownloads.size === 1 ? 'track' : 'tracks'
			}?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						useRemoveMultipleDownloads.mutate(
							tracksToDelete.map((t) => t.item),
							{
								onSuccess: () => {
									setSelectedDownloads(new Set())
								},
							},
						)
					},
				},
			],
		)
	}

	const clearAllDownloads = () => {
		Alert.alert(
			'Clear All Downloads',
			`Are you sure you want to delete all ${downloadedTracks?.length || 0} downloaded tracks? This action cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete All',
					style: 'destructive',
					onPress: () => {
						useClearAllDownloads.mutate(undefined, {
							onSuccess: () => {
								setSelectedDownloads(new Set())
							},
						})
					},
				},
			],
		)
	}

	const renderItem = ({ item }: { item: JellifyDownload }) => (
		<DownloadItem
			download={item}
			isSelected={selectedDownloads.has(item.item.Id!)}
			onToggleSelect={toggleSelectDownload}
		/>
	)

	const totalTracks = downloadedTracks?.length || 0
	const autoDownloadedCount = downloadedTracks?.filter((d) => d.isAutoDownloaded).length || 0
	const manualDownloadedCount = totalTracks - autoDownloadedCount

	return (
		<SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
			<YStack flex={1} padding='$4' space='$4'>
				{/* Storage Overview */}
				<Card elevate size='$4' backgroundColor='$background'>
					<Card.Header padding='$4'>
						<H3 color='$color' marginBottom='$3'>
							Storage Overview
						</H3>

						<YStack space='$2'>
							<XStack justifyContent='space-between'>
								<Text color='$gray11'>Total Downloads:</Text>
								<Text color='$color' fontWeight='600'>
									{totalTracks} tracks
								</Text>
							</XStack>

							<XStack justifyContent='space-between'>
								<Text color='$gray11'>Manual Downloads:</Text>
								<Text color='$color'>{manualDownloadedCount}</Text>
							</XStack>

							<XStack justifyContent='space-between'>
								<Text color='$gray11'>Auto Downloads:</Text>
								<Text color='$color'>{autoDownloadedCount}</Text>
							</XStack>

							{storageUsage && (
								<>
									<Separator marginVertical='$2' />
									<XStack justifyContent='space-between'>
										<Text color='$gray11'>Jellify Storage:</Text>
										<Text color='$color' fontWeight='600'>
											{formatBytes(storageUsage.storageInUseByJellify)}
										</Text>
									</XStack>

									<XStack justifyContent='space-between'>
										<Text color='$gray11'>Device Free Space:</Text>
										<Text color='$color'>
											{formatBytes(storageUsage.freeSpace)}
										</Text>
									</XStack>
								</>
							)}
						</YStack>
					</Card.Header>
				</Card>

				{/* Actions */}
				{totalTracks > 0 && (
					<Card elevate size='$4' backgroundColor='$background'>
						<Card.Header padding='$4'>
							<H4 color='$color' marginBottom='$3'>
								Bulk Actions
							</H4>

							<XStack space='$3' flexWrap='wrap'>
								<Button
									size='$3'
									variant='outlined'
									onPress={selectAll}
									icon={
										selectedDownloads.size === totalTracks ? (
											<Icon name='checkbox-marked' small />
										) : (
											<Icon name='checkbox-blank-outline' small />
										)
									}
								>
									{selectedDownloads.size === totalTracks
										? 'Deselect All'
										: 'Select All'}
								</Button>

								{selectedDownloads.size > 0 && (
									<Button
										size='$3'
										backgroundColor='$danger'
										onPress={deleteSelectedDownloads}
										icon={<Icon name='delete' small />}
										disabled={useRemoveMultipleDownloads.isPending}
									>
										Delete Selected ({selectedDownloads.size})
									</Button>
								)}

								<Button
									size='$3'
									backgroundColor='$danger'
									variant='outlined'
									onPress={clearAllDownloads}
									icon={<Icon name='delete-sweep' small />}
									disabled={useClearAllDownloads.isPending}
								>
									Clear All
								</Button>
							</XStack>
						</Card.Header>
					</Card>
				)}

				{/* Downloads List */}
				{totalTracks > 0 ? (
					<YStack flex={1}>
						<XStack
							justifyContent='space-between'
							alignItems='center'
							marginBottom='$3'
						>
							<H4 color='$color'>Downloaded Tracks</H4>
							<Text color='$gray11' fontSize='$3'>
								{selectedDownloads.size > 0 && `${selectedDownloads.size} selected`}
							</Text>
						</XStack>

						<FlashList
							data={sortedDownloads}
							renderItem={renderItem}
							estimatedItemSize={120}
							showsVerticalScrollIndicator={false}
							ItemSeparatorComponent={() => <YStack height='$2' />}
						/>
					</YStack>
				) : (
					<Card elevate size='$4' backgroundColor='$background' flex={1}>
						<Card.Header
							padding='$4'
							alignItems='center'
							justifyContent='center'
							flex={1}
						>
							<Icon name='cloud-off-outline' large color='$borderColor' />
							<Text fontSize='$5' color='$gray11' textAlign='center' marginTop='$3'>
								No downloads found
							</Text>
							<Text fontSize='$3' color='$gray9' textAlign='center' marginTop='$2'>
								Tracks you download will appear here
							</Text>
						</Card.Header>
					</Card>
				)}
			</YStack>
		</SafeAreaView>
	)
}
