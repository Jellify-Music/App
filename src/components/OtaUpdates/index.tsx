import React, { useEffect, useState } from 'react'
import {
	View,
	Text,
	Modal,
	StyleSheet,
	Platform,
	Alert,
	TouchableOpacity,
	LayoutAnimation,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import DeviceInfo from 'react-native-device-info'
import { OTA_UPDATE_ENABLED } from '../../configs/config'
import { githubOTA, OTAUpdateManager, reloadApp, getStoredOtaVersion } from 'react-native-nitro-ota'

const version = DeviceInfo.getVersion()

const gitBranch = `nitro_${version}_${Platform.OS}`

const { downloadUrl, versionUrl } = githubOTA({
	githubUrl: 'https://github.com/Jellify-Music/App-Bundles',
	otaVersionPath: 'ota.version', // optional, defaults to 'ota.version'
	ref: gitBranch, // optional, defaults to 'main'
})

const otaVersion = getStoredOtaVersion()
const isPRUpdate = otaVersion ? otaVersion.startsWith('PULL_REQUEST') : false

const otaManager = new OTAUpdateManager(downloadUrl, versionUrl)

export const downloadUpdate = (showCatchAlert: boolean = false) => {
	otaManager
		.downloadUpdate()
		.then(() => {
			Alert.alert('Jellify has been updated!', 'Restart to apply the changes', [
				{ text: 'OK', onPress: () => reloadApp() },
				{ text: 'Cancel', style: 'cancel' },
			])
		})
		.catch((error) => {
			if (showCatchAlert) {
				Alert.alert('Update not available')
			}
			console.error('Error downloading update:', error)
		})
}

const GitUpdateModal = () => {
	const progress = useSharedValue(0)
	const [loading, setLoading] = React.useState(false)

	const progressBarStyle = useAnimatedStyle(() => ({
		width: `${progress.value}%`,
	}))

	const [isVisible, setIsVisible] = React.useState(true)

	const onClose = () => {
		setIsVisible(false)
	}

	const onCheckGitVersion = () => {
		setLoading(true)
		otaManager
			.checkForUpdates()
			.then((update) => {
				if (update) {
					downloadUpdate()
				}
			})
			.catch((error) => {
				console.error('Error checking for updates:', error)
			})
			.finally(() => {
				setLoading(false)
			})
	}

	useEffect(() => {
		if (__DEV__ || !OTA_UPDATE_ENABLED || isPRUpdate) {
			return
		}
		onCheckGitVersion()
	}, [])

	return null
	return (
		<Modal visible={isVisible} transparent animationType='slide' onRequestClose={onClose}>
			<View style={styles.overlay}>
				<View style={styles.modalContent}>
					<Text style={styles.title}>Jellify Update</Text>

					<View style={styles.progressContainer}>
						<Animated.View style={[styles.progressBar, progressBarStyle]} />
					</View>

					<TouchableOpacity
						style={[styles.button, loading && { opacity: 0.6 }]}
						onPress={onCheckGitVersion}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Updating...' : 'Check for Update'}
						</Text>
					</TouchableOpacity>

					{!loading && (
						<TouchableOpacity onPress={onClose} style={styles.closeBtn}>
							<Text style={styles.closeText}>Close</Text>
						</TouchableOpacity>
					)}
				</View>
			</View>
		</Modal>
	)
}

export default GitUpdateModal

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(11, 2, 32, 0.95)', // semi-transparent overlay
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#0B0220',
		padding: 24,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	title: {
		fontSize: 22,
		color: 'white',
		fontWeight: '700',
		marginBottom: 16,
		textAlign: 'center',
	},
	progressContainer: {
		height: 12,
		width: '100%',
		backgroundColor: '#1A1A2E',
		borderRadius: 6,
		overflow: 'hidden',
		marginBottom: 20,
	},
	progressBar: {
		height: '100%',
		backgroundColor: '#C084FC',
		borderRadius: 6,
	},
	button: {
		backgroundColor: '#FF5CAA',
		paddingVertical: 14,
		borderRadius: 10,
		marginBottom: 14,
	},
	buttonText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
		textAlign: 'center',
	},
	closeBtn: {
		paddingVertical: 10,
		alignItems: 'center',
	},
	closeText: {
		color: '#aaa',
		fontSize: 14,
	},
})
