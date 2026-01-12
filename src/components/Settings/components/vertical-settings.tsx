import React, { useState } from 'react'
import {
	ScrollView,
	YStack,
	XStack,
	SizableText,
	Card,
	RadioGroup,
	Paragraph,
	Avatar,
	Spinner,
} from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Linking, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import SettingsSection from './settings-section'
import Icon from '../../Global/components/icon'
import { Text } from '../../Global/helpers/text'
import Button from '../../Global/helpers/button'
import Input from '../../Global/helpers/input'
import { SwitchWithLabel } from '../../Global/helpers/switch-with-label'
import { RadioGroupItemWithLabel } from '../../Global/helpers/radio-group-item-with-label'
import StatusBar from '../../Global/helpers/status-bar'

import { SettingsStackParamList } from '../../../screens/Settings/types'
import { useJellifyUser, useJellifyLibrary, useJellifyServer } from '../../../stores'
import {
	ThemeSetting,
	useHideRunTimesSetting,
	useReducedHapticsSetting,
	useSendMetricsSetting,
	useThemeSetting,
} from '../../../stores/settings/app'
import { useSwipeSettingsStore } from '../../../stores/settings/swipe'
import {
	useDisplayAudioQualityBadge,
	useEnableAudioNormalization,
	useStreamingQuality,
} from '../../../stores/settings/player'
import {
	DownloadQuality,
	useAutoDownload,
	useDownloadQuality,
} from '../../../stores/settings/usage'
import { useDeveloperOptionsEnabled, usePrId } from '../../../stores/settings/developer'
import { useAllDownloadedTracks } from '../../../api/queries/download'
import {
	usePendingDownloads,
	useCurrentDownloads,
	useClearAllPendingDownloads,
} from '../../../stores/network/downloads'
import usePatrons from '../../../api/queries/patrons'
import StreamingQuality from '../../../enums/audio-quality'
import HTTPS from '../../../constants/protocols'
import { version } from '../../../../package.json'
import { getStoredOtaVersion } from 'react-native-nitro-ota'
import { downloadUpdate } from '../../OtaUpdates'
import { downloadPRUpdate } from '../../OtaUpdates/otaPR'
import { useInfoCaption } from '../../../hooks/use-caption'

type ThemeOptionConfig = {
	value: ThemeSetting
	label: string
	icon: string
}

const THEME_OPTIONS: ThemeOptionConfig[] = [
	{ value: 'system', label: 'Match Device', icon: 'theme-light-dark' },
	{ value: 'light', label: 'Light', icon: 'white-balance-sunny' },
	{ value: 'dark', label: 'Dark', icon: 'weather-night' },
	{ value: 'oled', label: 'OLED Black', icon: 'invert-colors' },
]

function ThemeOptionCard({
	option,
	isSelected,
	onPress,
}: {
	option: ThemeOptionConfig
	isSelected: boolean
	onPress: () => void
}) {
	return (
		<XStack
			onPress={onPress}
			pressStyle={{ scale: 0.97 }}
			animation='quick'
			borderWidth='$1'
			borderColor={isSelected ? '$primary' : '$borderColor'}
			backgroundColor={isSelected ? '$background25' : '$background'}
			borderRadius='$4'
			padding='$2.5'
			alignItems='center'
			gap='$2'
			flex={1}
			minWidth='45%'
		>
			<Icon small name={option.icon} color={isSelected ? '$primary' : '$borderColor'} />
			<SizableText size='$3' fontWeight='600' flex={1}>
				{option.label}
			</SizableText>
			{isSelected && <Icon small name='check-circle-outline' color='$primary' />}
		</XStack>
	)
}

function ActionChip({
	active,
	label,
	icon,
	onPress,
}: {
	active: boolean
	label: string
	icon: string
	onPress: () => void
}) {
	return (
		<Button
			pressStyle={{ backgroundColor: '$neutral' }}
			onPress={onPress}
			backgroundColor={active ? '$success' : 'transparent'}
			borderColor={active ? '$success' : '$borderColor'}
			borderWidth='$0.5'
			color={active ? '$background' : '$color'}
			paddingHorizontal='$2.5'
			size='$2'
			borderRadius='$10'
			icon={<Icon name={icon} color={active ? '$background' : '$color'} small />}
		>
			<SizableText color={active ? '$background' : '$color'} size='$2'>
				{label}
			</SizableText>
		</Button>
	)
}

function PatronsList({ patrons }: { patrons: { fullName: string }[] | undefined }) {
	if (!patrons?.length) return null
	return (
		<XStack flexWrap='wrap' gap='$2' marginTop='$2'>
			{patrons.map((patron, index) => (
				<XStack key={index} alignItems='flex-start' maxWidth='$20'>
					<Text numberOfLines={1} lineBreakStrategyIOS='standard'>
						{patron.fullName}
					</Text>
				</XStack>
			))}
		</XStack>
	)
}

export default function VerticalSettings(): React.JSX.Element {
	const { top } = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	// User/Server state
	const [server] = useJellifyServer()
	const [user] = useJellifyUser()
	const [library] = useJellifyLibrary()

	// App settings
	const [themeSetting, setThemeSetting] = useThemeSetting()
	const [hideRunTimes, setHideRunTimes] = useHideRunTimesSetting()
	const [reducedHaptics, setReducedHaptics] = useReducedHapticsSetting()
	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	// Swipe settings
	const left = useSwipeSettingsStore((s) => s.left)
	const right = useSwipeSettingsStore((s) => s.right)
	const toggleLeft = useSwipeSettingsStore((s) => s.toggleLeft)
	const toggleRight = useSwipeSettingsStore((s) => s.toggleRight)

	// Player settings
	const [streamingQuality, setStreamingQuality] = useStreamingQuality()
	const [enableAudioNormalization, setEnableAudioNormalization] = useEnableAudioNormalization()
	const [displayAudioQualityBadge, setDisplayAudioQualityBadge] = useDisplayAudioQualityBadge()

	// Storage settings
	const [autoDownload, setAutoDownload] = useAutoDownload()
	const [downloadQuality, setDownloadQuality] = useDownloadQuality()
	const { data: downloadedTracks } = useAllDownloadedTracks()
	const pendingDownloads = usePendingDownloads()
	const currentDownloads = useCurrentDownloads()
	const clearAllPendingDownloads = useClearAllPendingDownloads()
	const activeDownloadsCount = pendingDownloads.length + currentDownloads.length

	// Developer settings
	const [developerOptionsEnabled, setDeveloperOptionsEnabled] = useDeveloperOptionsEnabled()
	const [prId, setPrId] = usePrId()
	const [localPrId, setLocalPrId] = useState(prId)

	// About
	const patrons = usePatrons()
	const { data: caption } = useInfoCaption()
	const otaVersion = getStoredOtaVersion()

	const handleSubmitPr = () => {
		if (localPrId.trim()) {
			setPrId(localPrId.trim())
			downloadPRUpdate(Number(localPrId.trim()))
		} else {
			Alert.alert('Error', 'Please enter a valid PR ID')
		}
	}

	const isSecure = server?.url.includes(HTTPS)

	return (
		<YStack flex={1} backgroundColor='$background'>
			<YStack height={top} backgroundColor='$primary' />
			<StatusBar invertColors />

			<ScrollView
				contentContainerStyle={{ paddingBottom: 160 }}
				showsVerticalScrollIndicator={false}
			>
				{/* User Profile Header */}
				<Card
					backgroundColor='$primary'
					borderRadius={0}
					paddingHorizontal='$4'
					paddingVertical='$4'
					marginBottom='$2'
				>
					<XStack alignItems='center' gap='$3'>
						<Avatar circular size='$6' backgroundColor='$background25'>
							<Avatar.Fallback>
								<Icon name='account-music' color='$background' />
							</Avatar.Fallback>
						</Avatar>
						<YStack flex={1}>
							<SizableText size='$6' fontWeight='bold' color='$background'>
								{user?.name ?? 'Unknown User'}
							</SizableText>
							<XStack alignItems='center' gap='$1.5'>
								<Icon
									name={isSecure ? 'lock' : 'lock-open'}
									color={isSecure ? '$background50' : '$warning'}
									small
								/>
								<SizableText size='$3' color='$background50'>
									{server?.name ?? 'Unknown Server'}
								</SizableText>
							</XStack>
						</YStack>
						<Button
							size='$3'
							backgroundColor='$background25'
							borderColor='$background50'
							borderWidth='$0.5'
							onPress={() => navigation.navigate('LibrarySelection')}
							icon={<Icon name='book-music' color='$background' small />}
						>
							<SizableText color='$background' size='$2'>
								{library?.musicLibraryName ?? 'Library'}
							</SizableText>
						</Button>
					</XStack>
				</Card>

				{/* Appearance Section */}
				<SettingsSection
					title='Appearance'
					icon='palette'
					iconColor='$primary'
					defaultExpanded
				>
					<YStack gap='$2'>
						<SizableText size='$3' color='$borderColor'>
							Theme
						</SizableText>
						<XStack flexWrap='wrap' gap='$2'>
							{THEME_OPTIONS.map((option) => (
								<ThemeOptionCard
									key={option.value}
									option={option}
									isSelected={themeSetting === option.value}
									onPress={() => setThemeSetting(option.value)}
								/>
							))}
						</XStack>
					</YStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Hide Runtimes</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Hide track duration lengths
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={hideRunTimes}
							onCheckedChange={setHideRunTimes}
							size='$2'
							label=''
						/>
					</XStack>
				</SettingsSection>

				{/* Gestures Section */}
				<SettingsSection title='Gestures' icon='gesture-swipe' iconColor='$success'>
					<Paragraph color='$borderColor' size='$2'>
						Single selection triggers on reveal; multiple selections show a menu.
					</Paragraph>

					<YStack gap='$2'>
						<SizableText size='$3'>Swipe Left</SizableText>
						<XStack gap='$2' flexWrap='wrap'>
							<ActionChip
								active={left.includes('ToggleFavorite')}
								label='Favorite'
								icon='heart'
								onPress={() => toggleLeft('ToggleFavorite')}
							/>
							<ActionChip
								active={left.includes('AddToPlaylist')}
								label='Add to Playlist'
								icon='playlist-plus'
								onPress={() => toggleLeft('AddToPlaylist')}
							/>
							<ActionChip
								active={left.includes('AddToQueue')}
								label='Add to Queue'
								icon='playlist-play'
								onPress={() => toggleLeft('AddToQueue')}
							/>
							<ActionChip
								active={left.includes('PlayNext')}
								label='Play Next'
								icon='playlist-music'
								onPress={() => toggleLeft('PlayNext')}
							/>
						</XStack>
					</YStack>

					<YStack gap='$2'>
						<SizableText size='$3'>Swipe Right</SizableText>
						<XStack gap='$2' flexWrap='wrap'>
							<ActionChip
								active={right.includes('ToggleFavorite')}
								label='Favorite'
								icon='heart'
								onPress={() => toggleRight('ToggleFavorite')}
							/>
							<ActionChip
								active={right.includes('AddToPlaylist')}
								label='Add to Playlist'
								icon='playlist-plus'
								onPress={() => toggleRight('AddToPlaylist')}
							/>
							<ActionChip
								active={right.includes('AddToQueue')}
								label='Add to Queue'
								icon='playlist-play'
								onPress={() => toggleRight('AddToQueue')}
							/>
							<ActionChip
								active={right.includes('PlayNext')}
								label='Play Next'
								icon='playlist-music'
								onPress={() => toggleRight('PlayNext')}
							/>
						</XStack>
					</YStack>
				</SettingsSection>

				{/* Playback Section */}
				<SettingsSection title='Playback' icon='play-circle' iconColor='$warning'>
					<YStack gap='$2'>
						<SizableText size='$4'>Streaming Quality</SizableText>
						<SizableText size='$2' color='$borderColor'>
							Changes apply to new tracks
						</SizableText>
						<RadioGroup
							value={streamingQuality}
							onValueChange={(value) =>
								setStreamingQuality(value as StreamingQuality)
							}
						>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Original}
								label='Original Quality'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.High}
								label='High (320kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Medium}
								label='Medium (192kbps)'
							/>
							<RadioGroupItemWithLabel
								size='$3'
								value={StreamingQuality.Low}
								label='Low (128kbps)'
							/>
						</RadioGroup>
					</YStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Audio Normalization</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Normalize volume between tracks
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={enableAudioNormalization}
							onCheckedChange={setEnableAudioNormalization}
							size='$2'
							label=''
						/>
					</XStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Quality Badge</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Display audio quality in player
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={displayAudioQualityBadge}
							onCheckedChange={setDisplayAudioQualityBadge}
							size='$2'
							label=''
						/>
					</XStack>
				</SettingsSection>

				{/* Storage Section */}
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
											{activeDownloadsCount === 1 ? 'download' : 'downloads'}{' '}
											in progress
										</SizableText>
										<SizableText size='$2' color='$borderColor'>
											{currentDownloads.length} active,{' '}
											{pendingDownloads.length} queued
										</SizableText>
									</YStack>
								</XStack>
								{pendingDownloads.length > 0 && (
									<Button
										size='$2'
										backgroundColor='$warning'
										color='$background'
										onPress={clearAllPendingDownloads}
										icon={
											<Icon name='close-circle' color='$background' small />
										}
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

				{/* Privacy Section */}
				<SettingsSection title='Privacy' icon='shield-account' iconColor='$success'>
					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Send Analytics</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Send usage and crash data
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={sendMetrics}
							onCheckedChange={setSendMetrics}
							size='$2'
							label=''
						/>
					</XStack>

					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Reduce Haptics</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Reduce haptic feedback intensity
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={reducedHaptics}
							onCheckedChange={setReducedHaptics}
							size='$2'
							label=''
						/>
					</XStack>
				</SettingsSection>

				{/* Developer Section */}
				<SettingsSection title='Developer' icon='code-braces' iconColor='$borderColor'>
					<XStack alignItems='center' justifyContent='space-between'>
						<YStack flex={1}>
							<SizableText size='$4'>Developer Options</SizableText>
							<SizableText size='$2' color='$borderColor'>
								Enable advanced developer features
							</SizableText>
						</YStack>
						<SwitchWithLabel
							checked={developerOptionsEnabled}
							onCheckedChange={setDeveloperOptionsEnabled}
							size='$2'
							label=''
						/>
					</XStack>

					{developerOptionsEnabled && (
						<YStack gap='$2' paddingTop='$1'>
							<SizableText size='$2' color='$borderColor'>
								Enter PR ID to test pull request builds
							</SizableText>
							<XStack gap='$2' alignItems='center'>
								<Input
									flex={1}
									placeholder='Enter PR ID'
									value={localPrId}
									onChangeText={setLocalPrId}
									keyboardType='numeric'
									size='$3'
								/>
								<Button
									size='$3'
									backgroundColor='$primary'
									color='$background'
									onPress={handleSubmitPr}
									circular
									icon={<Icon name='check' color='$background' small />}
								/>
							</XStack>
							{prId && (
								<SizableText color='$success' size='$2'>
									Current PR ID: {prId}
								</SizableText>
							)}
						</YStack>
					)}
				</SettingsSection>

				{/* About Section */}
				<SettingsSection title='About' icon='information' iconColor='$primary'>
					<YStack gap='$1'>
						<XStack alignItems='center' gap='$2'>
							<Icon name='jellyfish' color='$primary' />
							<SizableText size='$5' fontWeight='bold'>
								Jellify {version}
							</SizableText>
						</XStack>
						{caption && (
							<SizableText size='$2' color='$borderColor'>
								{caption}
							</SizableText>
						)}
						{otaVersion && (
							<SizableText size='$2' color='$borderColor'>
								OTA Version: {otaVersion}
							</SizableText>
						)}
					</YStack>

					<XStack gap='$4' flexWrap='wrap'>
						<XStack
							alignItems='center'
							gap='$1'
							onPress={() => Linking.openURL('https://github.com/Jellify-Music/App')}
							pressStyle={{ opacity: 0.7 }}
						>
							<Icon name='code-tags' small color='$borderColor' />
							<Text>View Source</Text>
						</XStack>
						<XStack
							alignItems='center'
							gap='$1'
							onPress={() => downloadUpdate(true)}
							pressStyle={{ opacity: 0.7 }}
						>
							<Icon name='cellphone-arrow-down' small color='$borderColor' />
							<Text>Update</Text>
						</XStack>
					</XStack>

					<YStack gap='$2'>
						<SizableText size='$3' fontWeight='600'>
							Caught a bug?
						</SizableText>
						<XStack gap='$4' flexWrap='wrap'>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() =>
									Linking.openURL('https://github.com/Jellify-Music/App/issues')
								}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='github' small color='$borderColor' />
								<Text>Report Issue</Text>
							</XStack>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() => Linking.openURL('https://discord.gg/yf8fBatktn')}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='chat' small color='$borderColor' />
								<Text>Join Discord</Text>
							</XStack>
						</XStack>
					</YStack>

					<YStack gap='$2'>
						<SizableText size='$3' fontWeight='600'>
							Wall of Fame
						</SizableText>
						<XStack gap='$4' flexWrap='wrap'>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() =>
									Linking.openURL(
										'https://github.com/sponsors/anultravioletaurora/',
									)
								}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='github' small color='$borderColor' />
								<Text>Sponsors</Text>
							</XStack>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() =>
									Linking.openURL('https://patreon.com/anultravioletaurora')
								}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='patreon' small color='$borderColor' />
								<Text>Patreon</Text>
							</XStack>
							<XStack
								alignItems='center'
								gap='$1'
								onPress={() => Linking.openURL('https://ko-fi.com/jellify')}
								pressStyle={{ opacity: 0.7 }}
							>
								<Icon name='coffee-outline' small color='$borderColor' />
								<Text>Ko-fi</Text>
							</XStack>
						</XStack>
						<PatronsList patrons={patrons} />
					</YStack>
				</SettingsSection>

				{/* Sign Out Button */}
				<YStack paddingHorizontal='$3' paddingVertical='$4'>
					<Button
						size='$4'
						backgroundColor='$danger'
						color='$background'
						onPress={() => navigation.navigate('SignOut')}
						icon={<Icon name='logout' color='$background' />}
					>
						Sign Out
					</Button>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
