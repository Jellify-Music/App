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
import hotUpdate from 'react-native-ota-hot-update'
import DeviceInfo from 'react-native-device-info'

const version = DeviceInfo.getVersion()

const gitBranch = `${version}/${Platform.OS}`

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

	console.log(isVisible, 'isVisible')
	const onCheckGitVersion = () => {
		setLoading(true)

		hotUpdate.git.checkForGitUpdate({
			branch: gitBranch,
			bundlePath: Platform.OS === 'ios' ? 'main.jsbundle' : 'index.android.bundle',
			url: 'https://github.com/Jellify-Music/App-Bundles',

			onCloneFailed(msg: string) {
				setLoading(false)
				// Alert.alert('Clone project faile .d!', msg)
			},
			onCloneSuccess() {
				Alert.alert('Jellify has been updated!', 'Restart to apply the changes', [
					{ text: 'OK', onPress: () => hotUpdate.resetApp() },
					{ text: 'Cancel', style: 'cancel' },
				])
			},
			onPullFailed(msg: string) {
				setLoading(false)
				// Alert.alert('Pull project failed!', msg)
			},
			onPullSuccess() {
				Alert.alert('Jellify has been updated!', 'Restart to apply the changes', [
					{ text: 'OK', onPress: () => hotUpdate.resetApp() },
					{ text: 'Cancel', style: 'cancel' },
				])
			},
			onProgress(received: number, total: number) {
				const percent = (+received / +total) * 100
				LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
				progress.value = withTiming(percent, { duration: 300 })
			},
			onFinishProgress() {
				setLoading(false)
			},
		})
	}

	useEffect(() => {
		if (__DEV__) {
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
