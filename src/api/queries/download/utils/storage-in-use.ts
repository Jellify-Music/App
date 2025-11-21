import RNFS from 'react-native-fs'
import DeviceInfo from 'react-native-device-info'

type JellifyStorage = {
	totalStorage: number
	freeSpace: number
	storageInUseByJellify: number
}

const fetchStorageInUse: () => Promise<JellifyStorage> = async () => {
	const totalStorage = await RNFS.getFSInfo()
	const storageInUse = await RNFS.stat(RNFS.DocumentDirectoryPath)
	const freeDiskStorage = await DeviceInfo.getFreeDiskStorage()

	return {
		totalStorage: totalStorage.totalSpace,
		freeSpace: freeDiskStorage,
		storageInUseByJellify: storageInUse.size,
	}
}

export default fetchStorageInUse
