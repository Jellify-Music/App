import React from 'react'
import { AppIconConfig } from '../../../../../types/Artwork/icon'
import useIsLightMode from '../../../../../hooks/use-is-light-mode'

export default function AppIconPreview({
	appIcon,
	size,
}: {
	appIcon: AppIconConfig
	size: number
}): React.JSX.Element {
	const isLightMode = useIsLightMode()

	const Preview = isLightMode ? appIcon.preview.light : appIcon.preview.dark

	return <Preview width={size} height={size} />
}
