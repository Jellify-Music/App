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

const androidDownloadUrl =
	'https://ota-bundle.473454749667feb097783cbf918593dc.r2.cloudflarestorage.com/ota/android/v0.21.3.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=2cfccacfc5cb9bea7be9145c5f8b72c5%2F20251130%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251130T153743Z&X-Amz-Expires=604800&X-Amz-Signature=e12efe11314b3ebb2311918e95d8ebdf43c0275ceb68f3299998e25e63a46d92&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject'

const iosDownloadUrl =
	'https://ota-bundle.473454749667feb097783cbf918593dc.r2.cloudflarestorage.com/ota/ios/v0.21.3.zip?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=2cfccacfc5cb9bea7be9145c5f8b72c5%2F20251130%2Fauto%2Fs3%2Faws4_request&X-Amz-Date=20251130T153744Z&X-Amz-Expires=604800&X-Amz-Signature=1e969d07502f3ab6976bb9571eff13b138b43dc98bc9c1149e55cd9db2549edf&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject'

const downloadUrl = Platform.OS === 'android' ? androidDownloadUrl : iosDownloadUrl

const otaVersion = getStoredOtaVersion()
const isPRUpdate = otaVersion ? otaVersion.startsWith('PULL_REQUEST') : false

const otaManager = new OTAUpdateManager(downloadUrl)

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
