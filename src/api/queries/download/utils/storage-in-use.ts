import RNFS from 'react-native-fs'

type JellifyStorage = {
	totalStorage: number
	freeSpace: number
	storageInUseByJellify: number
}

const fetchStorageInUse: () => Promise<JellifyStorage> = async () => {
	const totalStorage = await RNFS.getFSInfo()
	const storageInUse = await RNFS.stat(RNFS.DocumentDirectoryPath)

	return {
		totalStorage: totalStorage.totalSpace,
		freeSpace: totalStorage.freeSpace,
		storageInUseByJellify: storageInUse.size,
	}
}

export default fetchStorageInUse
