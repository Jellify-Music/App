import { checkGitVersion } from '../../services/ota'
import { OTA_UPDATE_ENABLED } from '../../configs/ota.config'
import { useEffect } from 'react'
import { confirmBundle, getStoredOtaVersion } from 'react-native-nitro-ota'

export const useOtaUpdate = () =>
	useEffect(() => {
		if (__DEV__ || !OTA_UPDATE_ENABLED) return

		// Reaching the first render proves this bundle boots, so a later unrelated crash must not roll it back
		confirmBundle()

		const version = getStoredOtaVersion()
		const isPrUpdate = version ? version.startsWith('PULL_REQUEST') : false

		if (isPrUpdate) return
		else checkGitVersion()
	}, [])
