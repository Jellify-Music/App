import React, { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import SettingsListGroup from '../../components/Settings/components/settings-list-group'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { Button, XStack } from 'tamagui'
import HomeStackParamList from './types'
import {
	useShowRecentArtistsSetting,
	useShowRecentlyPlayedSetting,
	useShowFrequentArtistsSetting,
	useShowFrequentlyPlayedTracksSetting,
} from '../../stores/settings/app'

export default function HomeCustomize(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>()

	// Read current persisted values once
	const [initialShowRecentArtists, setShowRecentArtistsStore] = useShowRecentArtistsSetting()
	const [initialShowRecentlyPlayed, setShowRecentlyPlayedStore] = useShowRecentlyPlayedSetting()
	const [initialShowFrequentArtists, setShowFrequentArtistsStore] =
		useShowFrequentArtistsSetting()
	const [initialShowFrequentlyPlayedTracks, setShowFrequentlyPlayedTracksStore] =
		useShowFrequentlyPlayedTracksSetting()

	// Local (unsaved) state
	const [showRecentArtists, setShowRecentArtists] = useState<boolean>(initialShowRecentArtists)
	const [showRecentlyPlayed, setShowRecentlyPlayed] = useState<boolean>(initialShowRecentlyPlayed)
	const [showFrequentArtists, setShowFrequentArtists] = useState<boolean>(
		initialShowFrequentArtists,
	)
	const [showFrequentlyPlayedTracks, setShowFrequentlyPlayedTracks] = useState<boolean>(
		initialShowFrequentlyPlayedTracks,
	)

	const handleSave = useCallback(() => {
		setShowRecentArtistsStore(showRecentArtists)
		setShowRecentlyPlayedStore(showRecentlyPlayed)
		setShowFrequentArtistsStore(showFrequentArtists)
		setShowFrequentlyPlayedTracksStore(showFrequentlyPlayedTracks)
		navigation.goBack()
	}, [
		showRecentArtists,
		showRecentlyPlayed,
		showFrequentArtists,
		showFrequentlyPlayedTracks,
		setShowRecentArtistsStore,
		setShowRecentlyPlayedStore,
		setShowFrequentArtistsStore,
		setShowFrequentlyPlayedTracksStore,
		navigation,
	])

	const handleCancel = useCallback(() => {
		// Discard local changes and go back
		navigation.goBack()
	}, [navigation])

	const settingsList = [
		{
			title: 'Recent Artists',
			iconName: 'account-music',
			iconColor: showRecentArtists ? '$primary' : '$borderColor',
			subTitle: 'Show recent artists on the Home page',
			children: (
				<SwitchWithLabel
					checked={showRecentArtists}
					onCheckedChange={setShowRecentArtists}
					size={'$3'}
					label={showRecentArtists ? 'Shown' : 'Hidden'}
				/>
			),
		},
		{
			title: 'Recently Played',
			iconName: 'history',
			iconColor: showRecentlyPlayed ? '$primary' : '$borderColor',
			subTitle: 'Show recently played tracks on the Home page',
			children: (
				<SwitchWithLabel
					checked={showRecentlyPlayed}
					onCheckedChange={setShowRecentlyPlayed}
					size={'$3'}
					label={showRecentlyPlayed ? 'Shown' : 'Hidden'}
				/>
			),
		},
		{
			title: 'Frequent Artists',
			iconName: 'heart',
			iconColor: showFrequentArtists ? '$primary' : '$borderColor',
			subTitle: 'Show frequent artists on the Home page',
			children: (
				<SwitchWithLabel
					checked={showFrequentArtists}
					onCheckedChange={setShowFrequentArtists}
					size={'$3'}
					label={showFrequentArtists ? 'Shown' : 'Hidden'}
				/>
			),
		},
		{
			title: 'Frequently Played Tracks',
			iconName: 'playlist-play',
			iconColor: showFrequentlyPlayedTracks ? '$primary' : '$borderColor',
			subTitle: 'Show frequently played tracks on the Home page',
			children: (
				<SwitchWithLabel
					checked={showFrequentlyPlayedTracks}
					onCheckedChange={setShowFrequentlyPlayedTracks}
					size={'$3'}
					label={showFrequentlyPlayedTracks ? 'Shown' : 'Hidden'}
				/>
			),
		},
	]

	const footer = (
		<XStack
			justifyContent='space-between'
			alignItems='center'
			padding='$4'
			borderTopWidth={1}
			borderTopColor='$borderColor'
		>
			<Button variant='outlined' size='$3' onPress={handleCancel}>
				Cancel
			</Button>
			<Button
				variant='outlined'
				size='$3'
				borderColor='$primary'
				color='$primary'
				onPress={handleSave}
			>
				Save
			</Button>
		</XStack>
	)

	return <SettingsListGroup settingsList={settingsList} footer={footer} />
}
