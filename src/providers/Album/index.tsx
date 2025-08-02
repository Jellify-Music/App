import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { QueryKeys } from '../../enums/query-keys'
import { useJellifyContext } from '..'
import { fetchAlbumDiscs } from '../../api/queries/item'
import { useQuery } from '@tanstack/react-query'
import { createContext, ReactNode, useContext } from 'react'

interface AlbumContext {
	album: BaseItemDto
	discs: { title: string; data: BaseItemDto[] }[] | undefined
	isPending: boolean
}

function AlbumContextInitializer(album: BaseItemDto): AlbumContext {
	const { api } = useJellifyContext()

	const { data: discs, isPending } = useQuery({
		queryKey: [QueryKeys.ItemTracks, album.Id!],
		queryFn: () => fetchAlbumDiscs(api, album),
	})

	return {
		album,
		discs,
		isPending,
	}
}

const AlbumContext = createContext<AlbumContext>({
	album: {},
	discs: [],
	isPending: false,
})

export const AlbumProvider: ({
	album,
	children,
}: {
	album: BaseItemDto
	children: ReactNode
}) => React.JSX.Element = ({ album, children }) => {
	const context = AlbumContextInitializer(album)

	return <AlbumContext.Provider value={{ ...context }}>{children}</AlbumContext.Provider>
}

export const useAlbumContext = () => useContext(AlbumContext)
