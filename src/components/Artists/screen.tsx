import React from 'react'
import Artists, { ArtistsProps } from './component'

export default function ArtistsScreen(props: ArtistsProps): React.JSX.Element {
	return <Artists {...props} />
}
