/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react'
import { Platform } from 'react-native'
import { useJellifyContext } from '../providers'
import { createSportsCarData, updateSportsCarData } from '../utils/sportscar-formatter'
import { useAllDownloadedTracks } from '../api/queries/download'
import useStreamingDeviceProfile from '../stores/device-profile'
import { useRecentlyPlayedTracks } from '../api/queries/recents'

/**
 * Component to initialize and manage SportsCar for Android Auto
 * This component must be placed inside the HomeProvider context
 */
export default function SportsCarInitializer(): React.JSX.Element | null {
	const { api } = useJellifyContext()
	const { data: recentTracks } = useRecentlyPlayedTracks()
	const { data: downloadedTracks } = useAllDownloadedTracks()
	const deviceProfile = useStreamingDeviceProfile()

	// Initialize SportsCar for Android Auto
	useEffect(() => {
		console.log('initializing sportsCar', Platform.OS, api, recentTracks)
		if (Platform.OS === 'android' && api && recentTracks) {
			try {
				const { AndroidAuto } = require('react-native-sportscar')
				const sportsCarData = createSportsCarData(
					recentTracks,
					api,
					downloadedTracks ?? [],
					deviceProfile,
				)
				console.log('sportsCarData', sportsCarData)
				// Initialize SportsCar with the formatted data
				console.log('sportsCarData', sportsCarData)
				AndroidAuto.initializeMediaLibrary(sportsCarData)
					.then((success: boolean) => {
						if (success) {
							console.log('SportsCar initialized with recently played data')
						} else {
							console.error('Failed to initialize SportsCar')
						}
					})
					.catch((error: any) => {
						console.error('Failed to initialize SportsCar:', error)
					})
			} catch (error) {
				console.error('Failed to require SportsCar module:', error)
			}
		}
	}, [api, recentTracks, downloadedTracks, deviceProfile])

	// Update SportsCar when recent tracks change
	useEffect(() => {
		if (Platform.OS === 'android' && api && recentTracks && recentTracks.length > 0) {
			try {
				const { AndroidAuto } = require('react-native-sportscar')
				const sportsCarData = updateSportsCarData(
					recentTracks,
					api,
					downloadedTracks ?? [],
					deviceProfile,
				)

				// Update SportsCar with new data
				AndroidAuto.updateMediaLibrary(sportsCarData)
					.then((success: boolean) => {
						if (success) {
							console.log('SportsCar updated with new recently played data')
						} else {
							console.error('Failed to update SportsCar')
						}
					})
					.catch((error: any) => {
						console.error('Failed to update SportsCar:', error)
					})
			} catch (error) {
				console.error('Failed to update SportsCar module:', error)
			}
		}
	}, [recentTracks, downloadedTracks, deviceProfile])

	// Set up SportsCar event listeners
	useEffect(() => {
		if (Platform.OS === 'android') {
			try {
				const { AndroidAuto } = require('react-native-sportscar')

				// Listen for playback state changes
				const playbackStateListener = AndroidAuto.addEventListener(
					'playbackStateChanged',
					(event: any) => {
						console.log('SportsCar playback state changed:', event)
					},
				)

				// Listen for media changes
				const mediaChangedListener = AndroidAuto.addEventListener(
					'mediaChanged',
					(event: any) => {
						console.log('SportsCar media changed:', event)
					},
				)

				// Listen for position changes
				const positionChangedListener = AndroidAuto.addEventListener(
					'positionChanged',
					(event: any) => {
						console.log('SportsCar position changed:', event)
					},
				)

				// Cleanup listeners on unmount
				return () => {
					playbackStateListener.remove()
					mediaChangedListener.remove()
					positionChangedListener.remove()
				}
			} catch (error) {
				console.error('Failed to set up SportsCar event listeners:', error)
			}
		}
	}, [])

	// This component doesn't render anything
	return null
}
