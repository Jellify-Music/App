declare module 'react-native-config' {
	export interface NativeConfig {
		OTA_UPDATE_ENABLED?: string
		IS_MAESTRO_BUILD?: string
	}

	export const Config: NativeConfig
	export default Config
}
