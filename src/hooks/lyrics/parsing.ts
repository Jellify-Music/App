import { useState, useEffect } from 'react'
import { ParsedLyricLine } from '../../types/Lyrics'

export const useShowNoLyricsMessage = (parsedLyrics: ParsedLyricLine[]) => {
	const [showNoLyricsMessage, setShowNoLyricsMessage] = useState(false)

	useEffect(() => {
		if (parsedLyrics.length > 0) {
			setShowNoLyricsMessage(false)
			return
		}
		const timer = setTimeout(() => setShowNoLyricsMessage(true), 2000)

		return () => clearTimeout(timer)
	}, [parsedLyrics.length])

	return showNoLyricsMessage
}
