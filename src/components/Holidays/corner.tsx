import React, { memo } from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { useHolidayTokens } from './hooks'

type HolidayCornerProps = {
	kind: 'album' | 'playlist'
	/** Edge length of the card this corner sits on */
	cardSize: number
}

/**
 * Corner indicator for album and playlist cards, as drawn in the Holidays design:
 * a red triangle with a gold-ringed dot for albums, a green one with a cassette for playlists.
 */
function HolidayCorner({ kind, cardSize }: HolidayCornerProps): React.JSX.Element {
	const tokens = useHolidayTokens()
	const isAlbum = kind === 'album'

	// Design: 52 of a 103 card (albums), 40 of an 84 card (playlists)
	const legs = cardSize * (isAlbum ? 52 / 103 : 40 / 84)

	return (
		<Svg
			width={legs}
			height={legs}
			viewBox={`0 0 ${legs} ${legs}`}
			pointerEvents='none'
			style={styles.corner}
		>
			<Path
				d={`M${legs} 0L${legs} ${legs}L0 ${legs}Z`}
				fill={isAlbum ? tokens.redCorner : tokens.greenCorner}
			/>
			{isAlbum ? (
				<Circle
					cx={legs - 13.5}
					cy={legs - 13.5}
					r={5}
					fill='#FFFFFF'
					stroke={tokens.goldDot}
					strokeWidth={3}
				/>
			) : (
				<>
					<Rect
						x={legs - 19 + 0.5}
						y={legs - 16 + 0.5}
						width={13}
						height={9}
						rx={2}
						fill='#FFFFFF'
					/>
					<Circle
						cx={legs - 19 + 4.5}
						cy={legs - 16 + 4.5}
						r={1.6}
						fill={tokens.greenDeep}
					/>
					<Circle
						cx={legs - 19 + 9.5}
						cy={legs - 16 + 4.5}
						r={1.6}
						fill={tokens.greenDeep}
					/>
				</>
			)}
		</Svg>
	)
}

const styles = StyleSheet.create({
	corner: {
		position: 'absolute',
		right: 0,
		bottom: 0,
	},
})

export default memo(HolidayCorner)
