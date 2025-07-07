const getQualityLabel = (quality: string) => {
	switch (quality) {
		case 'original':
			return 'Original Quality'
		case 'high':
			return 'High (320kbps)'
		case 'medium':
			return 'Medium (192kbps)'
		case 'low':
			return 'Low (128kbps)'
		default:
			return 'Medium (192kbps)'
	}
}

const getBandwidthEstimate = (quality: string) => {
	switch (quality) {
		case 'original':
			return 'Varies (highest bandwidth)'
		case 'high':
			return '~2.4 MB/min'
		case 'medium':
			return '~1.4 MB/min'
		case 'low':
			return '~1.0 MB/min'
		default:
			return '~1.4 MB/min'
	}
}

export { getQualityLabel, getBandwidthEstimate }
