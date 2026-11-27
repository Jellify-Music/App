/** The same colour with no opacity, so a fade to it doesn't pass through grey */
export function transparentOf(color: string): string {
	const hex = /^#([0-9a-f]{6})/i.exec(color)
	if (hex) return `#${hex[1]}00`

	const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(color)
	if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0)`

	return 'transparent'
}
