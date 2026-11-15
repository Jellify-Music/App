import React from 'react'
import { SvgProps } from 'react-native-svg'

export type AppIconValue = 'Default' | 'Trans' | 'Pride'

export type AppIconConfig = {
	value: AppIconValue
	label: string
	/**
	 * The artwork the native icon is built from, per appearance.
	 *
	 * Imported straight from the Icon Composer assets in `ios/` so the
	 * preview always matches what lands on the home screen
	 */
	preview: {
		light: React.FC<SvgProps>
		dark: React.FC<SvgProps>
	}
	/**
	 * The name the native module knows this icon by.
	 *
	 * On iOS this is the name of the `.icon` file listed in
	 * ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES, on Android it is the
	 * suffix of the `MainActivity<Name>` activity-alias in the manifest
	 */
	nativeName: string
}
