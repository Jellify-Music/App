import React from 'react'
// Google Cast (react-native-google-cast) removed — nitro-player handles device
// selection and media loading natively. This RNGC device row is no longer used.
// import CastContext, { Device, MediaHlsSegmentFormat } from 'react-native-google-cast'

interface CastDeviceProps {
	// device: Device
	device: unknown
	isActive: boolean
}

 
export default function CastDevice(_props: CastDeviceProps): React.JSX.Element | null {
	return null
}

// --- Original RNGC implementation (commented out) ---
// export default function CastDevice({ device, isActive = false }: CastDeviceProps): React.JSX.Element {
// 	const { deviceId, friendlyName, modelName } = device
// 	const onPress = async () => {
// 		const sessionManager = CastContext.getSessionManager()
// 		await sessionManager.startSession(deviceId)
// 		await loadMediaToCast()
// 	}
// 	...
// }
//
// const loadMediaToCast = async () => { ... CastContext.getSessionManager() ... }
