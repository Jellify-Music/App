import React from 'react'
import VerticalSettings from './components/vertical-settings'
import HolidaySettings from '../Holidays/settings'
import { useIsHolidays } from '../Holidays/hooks'

export default function Settings(): React.JSX.Element {
	const isHolidays = useIsHolidays()

	return isHolidays ? <HolidaySettings /> : <VerticalSettings />
}
