import { useAppSettingsStore } from '../../../../stores/settings/app'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { StyleSheet } from 'react-native'
import { Square, Card, getTokenValue } from 'tamagui'
import Icon from '../icon'
import { CardSizeToken } from './types'

const footerTypesNeedingIndicating: BaseItemKind[] = [
	BaseItemKind.MusicAlbum,
	BaseItemKind.Playlist,
]

interface ItemCardComponentFooterProps {
	type: BaseItemKind
	size: CardSizeToken
}

export default function ItemCardFooter({ size, type }: ItemCardComponentFooterProps) {
	const { hideItemIndicators } = useAppSettingsStore()

	const displayFooter = footerTypesNeedingIndicating.includes(type) && !hideItemIndicators

	const iconName: 'cassette' | 'disc' = type === BaseItemKind.Playlist ? 'cassette' : 'disc'

	const cornerSize = getTokenValue(size, 'size') * 0.45
	const squareSize = cornerSize * Math.SQRT2
	const iconSize = cornerSize / 2.5
	// Inset the larger glyph from the circular card's edge.
	const iconInset = cornerSize / 10

	return (
		displayFooter && (
			<Card.Footer
				testID='card-footer'
				position='absolute'
				bottom={0}
				right={0}
				width={cornerSize}
				height={cornerSize}
				padding={0}
				pointerEvents='none'
			>
				<Square
					testID='card-footer-background'
					backgroundColor='primary'
					size={squareSize}
					position='absolute'
					bottom={-squareSize / 2}
					right={-squareSize / 2}
					style={styles.shadow}
					rotate='45deg'
				/>
				<Icon
					testID={`card-footer-${iconName}`}
					size={iconSize}
					color='background'
					name={iconName}
					position='absolute'
					bottom={iconInset}
					right={iconInset}
					width={iconSize}
					height={iconSize}
					style={styles.icon}
				/>
			</Card.Footer>
		)
	)
}

const styles = StyleSheet.create({
	icon: {
		shadowColor: 'black',
		shadowRadius: 3,
		shadowOpacity: 0.1,
		shadowOffset: {
			height: 3,
			width: 0,
		},
	},
	shadow: {
		boxShadow: [
			{
				offsetY: 3,
				offsetX: 0,
				blurRadius: 6,
				spreadDistance: 1,
				color: 'black',
			},
		],
	},
})
