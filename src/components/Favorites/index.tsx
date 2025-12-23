import React from 'react'
import Search, { SearchProps } from '../Search'

export default function Favorites(props: SearchProps): React.JSX.Element {
	return <Search {...props} forceFavorites={true} title='Favorites' />
}
