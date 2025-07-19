import { PermissionsAndroid, Platform } from 'react-native'

export const requestStoragePermission = async () => {
	if (Platform.OS === 'android') {
		try {
			const granted = await PermissionsAndroid.requestMultiple([
				PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
				PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
			])

			const readGranted =
				granted['android.permission.READ_EXTERNAL_STORAGE'] ===
				PermissionsAndroid.RESULTS.GRANTED
			const writeGranted =
				granted['android.permission.WRITE_EXTERNAL_STORAGE'] ===
				PermissionsAndroid.RESULTS.GRANTED

			return readGranted && writeGranted
		} catch (err) {
			console.warn(err)
			return false
		}
	} else {
		return true
	}
}
