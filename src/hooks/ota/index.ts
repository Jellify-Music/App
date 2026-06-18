import { checkGitVersion } from '../../services/ota'
import { OTA_UPDATE_ENABLED } from '../../configs/ota.config'
import { useEffect } from 'react'
import { getStoredOtaVersion } from 'react-native-nitro-ota'

export const useOtaUpdate = () =>
	useEffect(() => {
		if (__DEV__ || !OTA_UPDATE_ENABLED) return

		const version = getStoredOtaVersion()
		const isPrUpdate = version ? version.startsWith('PULL_REQUEST') : false

		if (isPrUpdate) return
		else checkGitVersion()
	})
