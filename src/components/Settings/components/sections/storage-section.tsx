import React from 'react'
import { XStack, YStack, SizableText, Card, Spinner, RadioGroup } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import SettingsSection from '../settings-section'
import Icon from '../../../Global/components/icon'
import Button from '../../../Global/helpers/button'
import { SwitchWithLabel } from '../../../Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../../Global/helpers/radio-group-item-with-label'
import { SettingsStackParamList } from '../../../../screens/Settings/types'
import {
	DownloadQuality,
	useAutoDownload,
	useDownloadQuality,
} from '../../../../stores/settings/usage'
import { useAllDownloadedTracks } from '../../../../api/queries/download'
import {
	usePendingDownloads,
	useCurrentDownloads,
	useClearAllPendingDownloads,
} from '../../../../stores/network/downloads'

export default function StorageSection(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const [autoDownload, setAutoDownload] = useAutoDownload()
	const [downloadQuality, setDownloadQuality] = useDownloadQuality()
	const { data: downloadedTracks } = useAllDownloadedTracks()
	const pendingDownloads = usePendingDownloads()
	const currentDownloads = useCurrentDownloads()
	const clearAllPendingDownloads = useClearAllPendingDownloads()
	const activeDownloadsCount = pendingDownloads.length + currentDownloads.length

	return (
		<SettingsSection title='Storage' icon='harddisk' iconColor='$primary'>
			{activeDownloadsCount > 0 && (
				<Card
					backgroundColor='$backgroundFocus'
					borderRadius='$4'
					borderWidth={1}
					borderColor='$primary'
					padding='$3'
				>
					<XStack alignItems='center' justifyContent='space-between'>
						<XStack alignItems='center' gap='$2'>
							<Spinner size='small' color='$primary' />
							<YStack>
								<SizableText size='$4' fontWeight='600'>
									{activeDownloadsCount}{' '}
									{activeDownloadsCount === 1 ? 'download' : 'downloads'} in
									progress
								</SizableText>
								<SizableText size='$2' color='$borderColor'>
									{currentDownloads.length} active, {pendingDownloads.length}{' '}
									queued
								</SizableText>
							</YStack>
						</XStack>
						{pendingDownloads.length > 0 && (
							<Button
								size='$2'
								backgroundColor='$warning'
								color='$background'
								onPress={clearAllPendingDownloads}
								icon={<Icon name='close-circle' color='$background' small />}
							>
								<SizableText color='$background' size='$2'>
									Cancel
								</SizableText>
							</Button>
						)}
					</XStack>
				</Card>
			)}

			<XStack
				alignItems='center'
				justifyContent='space-between'
				onPress={() => navigation.navigate('StorageManagement')}
				pressStyle={{ opacity: 0.7 }}
			>
				<YStack flex={1}>
					<SizableText size='$4'>Downloaded Tracks</SizableText>
					<SizableText size='$2' color='$borderColor'>
						{downloadedTracks?.length ?? 0}{' '}
						{downloadedTracks?.length === 1 ? 'song' : 'songs'} stored offline
					</SizableText>
				</YStack>
				<Icon name='chevron-right' color='$borderColor' />
			</XStack>

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
					<RadioGroupItemWithLabel size='$3' value='original' label='Original Quality' />
					<RadioGroupItemWithLabel size='$3' value='high' label='High (320kbps)' />
					<RadioGroupItemWithLabel size='$3' value='medium' label='Medium (192kbps)' />
					<RadioGroupItemWithLabel size='$3' value='low' label='Low (128kbps)' />
				</RadioGroup>
			</YStack>
		</SettingsSection>
	)
}
