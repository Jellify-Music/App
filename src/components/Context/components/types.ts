import type { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import type { ThemeTokens } from 'tamagui'
import type { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client'

export type ContextMenuRowImageProp =
	| {
			iconName: MaterialDesignIconsIconName
			color?: ThemeTokens
	  }
	| {
			imageType: ImageType
			item: BaseItemDto
			circular?: boolean
	  }
	| {
			progress: number
	  }

export interface ContextMenuRowProps {
	imageProp: ContextMenuRowImageProp
	label: string
	onPress?: () => void
	disabled?: boolean
}
