import React, { useEffect, useState } from 'react'
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	Alert,
	FlatList,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import RNFS from 'react-native-fs'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
} from 'react-native-reanimated'
import { deleteAudioCache,getAudioCache } from '../Network/offlineModeUtils'

// 🔹 Single Download Item with animated progress bar
const DownloadItem = ({ name, progress,fileName }: { name: string; progress: number,fileName:string }) => {
	const progressValue = useSharedValue(progress)

	useEffect(() => {
		progressValue.value = withTiming(progress, { duration: 300 })
	}, [progress])

	const animatedStyle = useAnimatedStyle(() => ({
		width: `${progressValue.value * 100}%`,
	}))

	return (
		<View style={styles.item}>
			<Text style={styles.label}>{fileName}</Text>
			<View style={styles.downloadBar}>
				<Animated.View style={[styles.downloadFill, animatedStyle]} />
			</View>
		</View>
	)
}

// 🔹 Main UI Component
export const StorageBar = () => {
	const [used, setUsed] = useState(0)
	const [total, setTotal] = useState(1)

	const { data: downloads } = useQuery({
		queryKey: ['downloads'],
		initialData: {},
        
	})

	const usageShared = useSharedValue(0)
	const percentUsed = used / total

	const storageBarStyle = useAnimatedStyle(() => ({
		width: `${usageShared.value * 100}%`,
	}))

	useEffect(() => {
		usageShared.value = withTiming(percentUsed, { duration: 500 })
	}, [percentUsed])

	// Refresh storage info
	const refreshStats = async () => {
		const files = await RNFS.readDir(RNFS.DocumentDirectoryPath)
		let usedBytes = 0
		for (const file of files) {
			const stat = await RNFS.stat(file.path)
			usedBytes += Number(stat.size)
		}
		const info = await RNFS.getFSInfo()
		setUsed(usedBytes)
		setTotal(info.totalSpace)
	}

	const deleteAllDownloads = async () => {
		const files = getAudioCache()
		for (const file of files) {
			await RNFS.unlink(file.url).catch(() => {})
		}
		Alert.alert('Deleted', 'All downloads removed.')
		deleteAudioCache()
		refreshStats()
	}

	useEffect(() => {
		refreshStats()
	}, [])

	const downloadList = Object.entries(downloads || {}) as [string, { name: string; progress: number,songName:string }][]

	return (
		<View style={styles.container}>
			{/* Storage Usage */}
			<Text style={styles.title}>📦 Storage Usage</Text>
			<Text style={styles.usage}>
				{(used / 1024 / 1024).toFixed(2)} MB / {(total / 1024 / 1024 / 1024).toFixed(2)} GB
			</Text>
			<View style={styles.progressBackground}>
				<Animated.View style={[styles.progressFill, storageBarStyle]} />
			</View>

			{/* Active Downloads */}
			{downloadList.length > 0 && (
				<>
					<Text style={[styles.title, { marginTop: 24 }]}>⬇️ Active Downloads</Text>
					<FlatList
						data={downloadList}
						keyExtractor={([url]) => url}
						renderItem={({ item }) => {
							const [url, { name, progress,songName }] = item
							return <DownloadItem name={name} progress={progress} fileName={songName} />
						}}
						contentContainerStyle={{ paddingBottom: 40 }}
					/>
				</>
			)}

			{/* Delete All Downloads */}
			<Pressable style={styles.deleteButton} onPress={deleteAllDownloads}>
				<MaterialIcons name="delete-outline" size={20} color="#ff4d4f" />
				<Text style={styles.deleteText}> Delete Downloads</Text>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#1c1c2e',
	},
	title: {
		color: 'white',
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	usage: {
		color: '#aaa',
		fontSize: 14,
		marginBottom: 12,
	},
	progressBackground: {
		height: 10,
		backgroundColor: '#333',
		borderRadius: 5,
		overflow: 'hidden',
	},
	progressFill: {
		height: 10,
		backgroundColor: '#ff2d75',
		borderRadius: 5,
	},
	item: {
		marginTop: 16,
	},
	label: {
		color: '#ccc',
		fontSize: 14,
		marginBottom: 4,
	},
	downloadBar: {
		height: 8,
		backgroundColor: '#2e2e3f',
		borderRadius: 4,
		overflow: 'hidden',
	},
	downloadFill: {
		height: 8,
		backgroundColor: '#00bcd4',
	},
	deleteButton: {
		marginTop: 30,
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'center',
		padding: 12,
		backgroundColor: '#2a0f13',
		borderRadius: 8,
	},
	deleteText: {
		color: '#ff4d4f',
		fontSize: 15,
		fontWeight: '600',
	},
})
