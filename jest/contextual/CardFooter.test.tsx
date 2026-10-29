import React from 'react'
import { StyleSheet } from 'react-native'
import { render } from '@testing-library/react-native'
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client'
import { Card, getTokenValue, TamaguiProvider } from 'tamagui'
import config from '../../src/configs/tamagui.config'
import ItemCardFooter from '../../src/components/Global/components/Card/footer'
import { CardSizeToken } from '../../src/components/Global/components/Card/types'
import { useAppSettingsStore } from '../../src/stores/settings/app'

jest.mock('../../src/stores/settings/app', () => ({
	useAppSettingsStore: jest.fn(() => ({ hideItemIndicators: false })),
}))

const renderFooter = (size: CardSizeToken, type: BaseItemKind) =>
	render(
		<TamaguiProvider config={config} defaultTheme='purple_dark'>
			<Card width={size} height={size}>
				<ItemCardFooter size={size} type={type} />
			</Card>
		</TamaguiProvider>,
	)

describe('ItemCardFooter', () => {
	it.each(['8', '10', '12'] as const)(
		'keeps both indicators proportional and inside the corner at card size %s',
		async (size) => {
			for (const [type, name] of [
				[BaseItemKind.MusicAlbum, 'disc'],
				[BaseItemKind.Playlist, 'cassette'],
			] as const) {
				const screen = await renderFooter(size, type)
				const footer = screen.getByTestId('card-footer')
				const background = StyleSheet.flatten(
					screen.getByTestId('card-footer-background').props.style,
				)
				const glyph = screen.getByTestId(`card-footer-${name}`)
				const icon = StyleSheet.flatten(glyph.parent?.props.style)
				const fontSize = StyleSheet.flatten(glyph.props.style).fontSize
				const cardSize = getTokenValue(size, 'size')
				const cornerSize = cardSize * 0.45

				expect(cornerSize).toBeGreaterThan(0)
				expect(footer).toHaveStyle({
					position: 'absolute',
					bottom: 0,
					right: 0,
					width: cornerSize,
					height: cornerSize,
					paddingTop: 0,
					paddingBottom: 0,
					paddingLeft: 0,
					paddingRight: 0,
					pointerEvents: 'none',
				})
				expect(background.transform).toContainEqual({ rotate: '45deg' })
				expect(background.width / Math.SQRT2).toBeCloseTo(cornerSize)
				expect(background.height).toBe(background.width)
				expect(background.bottom).toBe(-background.width / 2)
				expect(background.right).toBe(-background.width / 2)
				expect(fontSize / cardSize).toBeCloseTo(0.18)
				expect(icon.width).toBe(fontSize)
				expect(icon.height).toBe(fontSize)
				expect(icon.bottom).toBe(icon.right)
				expect(icon.right).toBeCloseTo(cornerSize / 10)
				expect(cornerSize ** 2 / 2 / cardSize ** 2).toBeCloseTo(0.10125)
				const iconCenter = icon.right + fontSize / 2
				expect(2 * iconCenter).toBeLessThan(cornerSize)
				// The icon's bounding box reaches the triangle's diagonal without crossing it.
				expect(icon.right + icon.width + icon.bottom + icon.height).toBeCloseTo(cornerSize)
				await screen.unmount()
			}
		},
	)

	it.each([BaseItemKind.Audio, BaseItemKind.MusicArtist])(
		'does not show an indicator for %s',
		async (type) => {
			const screen = await renderFooter('8', type)
			expect(screen.queryByTestId('card-footer')).toBeNull()
		},
	)

	it.each([BaseItemKind.MusicAlbum, BaseItemKind.Playlist])(
		'respects the hide-indicators setting for %s',
		async (type) => {
			jest.mocked(useAppSettingsStore).mockReturnValueOnce({
				...useAppSettingsStore(),
				hideItemIndicators: true,
			})
			const screen = await renderFooter('8', type)
			expect(screen.queryByTestId('card-footer')).toBeNull()
		},
	)
})
