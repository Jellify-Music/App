import useIsLightMode from '../../../hooks/use-is-light-mode'
import { useIsFocused } from '@react-navigation/native'
import { useMemo } from 'react'
import { StatusBar as RNStatusBar, StatusBarStyle } from 'react-native'

interface StatusBarProps {
	invertColors?: boolean | undefined
}

export default function StatusBar({ invertColors }: StatusBarProps): React.JSX.Element | null {
	const isFocused = useIsFocused()

	const isLightMode = useIsLightMode()

	const barStyle: StatusBarStyle = useMemo(
		() => (isLightMode || (invertColors && !isLightMode) ? 'dark-content' : 'light-content'),
		[invertColors, isLightMode],
	)

	return isFocused ? <RNStatusBar barStyle={barStyle} /> : null
}
