export const formatBytes = (bytes: number, decimals = 1): string => {
	if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
	const k = 1024
	const sizes = ['B', 'KB', 'MB', 'GB', 'TB'] as const
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
	const value = bytes / Math.pow(k, i)
	return `${value.toFixed(value >= 10 || decimals === 0 ? 0 : decimals)} ${sizes[i]}`
}
