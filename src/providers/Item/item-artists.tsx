import { createContext, useEffect } from 'react'
import { useJellifyContext } from '..'
import { QueryKeys } from '../../enums/query-keys'
import { fetchItem } from '../../api/queries/item'
import { queryClient } from '../../constants/query-client'

interface ItemArtistContext {
	artistId: string | undefined
}

const ItemArtistContext = createContext<ItemArtistContext>({
	artistId: undefined,
})

export const ItemArtistProvider: ({
	artistId,
}: {
	artistId: string | undefined
}) => React.JSX.Element = ({ artistId }) => {
	const { api } = useJellifyContext()

	useEffect(() => {
		/**
		 * Store queryable of artist item
		 */
		if (artistId)
			queryClient.ensureQueryData({
				queryKey: [QueryKeys.ArtistById, artistId],
				queryFn: () => fetchItem(api, artistId!),
			})
	})

	return <ItemArtistContext.Provider value={{ artistId }} />
}
