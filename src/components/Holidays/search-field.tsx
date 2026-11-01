import React, { memo } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { useTheme } from 'tamagui'
import { useHolidayTokens } from './hooks'

type HolidaySearchFieldProps = {
	value: string | undefined
	onChangeText: (value: string) => void
	placeholder: string
	testID?: string
	accessibilityLabel?: string
	accessibilityHint?: string
}

/**
 * The Holidays design's search field: 44px tall, 10px corners, a 1.5px outline, and a
 * magnifier. Same props as the shared `Input` uses on the Search screen.
 */
function HolidaySearchField({
	value,
	onChangeText,
	placeholder,
	testID,
	accessibilityLabel,
	accessibilityHint,
}: HolidaySearchFieldProps): React.JSX.Element {
	const theme = useTheme()
	const tokens = useHolidayTokens()

	return (
		<View style={styles.wrapper}>
			<View
				style={[
					styles.field,
					{ borderColor: tokens.outline, backgroundColor: tokens.field },
				]}
			>
				<Svg
					width={20}
					height={20}
					viewBox='0 0 24 24'
					fill='none'
					stroke={theme.borderColor.val}
					strokeWidth={2.2}
					strokeLinecap='round'
				>
					<Circle cx={10.5} cy={10.5} r={6.5} />
					<Path d='M15.5 15.5l5 5' />
				</Svg>

				<TextInput
					value={value}
					onChangeText={onChangeText}
					placeholder={placeholder}
					placeholderTextColor={theme.neutral.val}
					testID={testID}
					accessibilityLabel={accessibilityLabel}
					accessibilityHint={accessibilityHint}
					clearButtonMode='while-editing'
					autoCapitalize='none'
					autoCorrect={false}
					returnKeyType='search'
					style={[styles.input, { color: theme.color.val }]}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		paddingTop: 6,
		paddingHorizontal: 8,
		paddingBottom: 8,
	},
	field: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingHorizontal: 14,
		borderWidth: 1.5,
		borderRadius: 10,
	},
	input: {
		flex: 1,
		minWidth: 0,
		padding: 0,
		fontFamily: 'Figtree-Regular',
		fontSize: 17,
	},
})

export default memo(HolidaySearchField)
