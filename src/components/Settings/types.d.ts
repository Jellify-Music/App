export type SettingsTabList = {
	title: string
	iconName: string
	iconColor: ThemeTokens
	subTitle?: string
	children?: React.ReactNode
	onPress?: () => void
}[]
