import React from 'react'
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { useAppSettingsStore } from '../../stores/settings/app'
import { HolidayHeaderIcon, HolidayStackHeader } from './header'

type HolidayHeaderConfig = {
	icon?: HolidayHeaderIcon
	snow: { count: number; seed: number }
}

/**
 * Native stack options that swap in the Holidays header.
 *
 * Returns nothing for every other color scheme, so screens keep their native header. Use it
 * from an `options` function so it is read when the navigator renders.
 */
export function holidayHeaderOptions(config: HolidayHeaderConfig): NativeStackNavigationOptions {
	if (useAppSettingsStore.getState().colorPreset !== 'holidays') return {}

	return {
		header: (props) => <HolidayStackHeader props={props} {...config} />,
	}
}
