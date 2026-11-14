import { useQuery } from '@tanstack/react-query'
import { LibrariesQuery, PlaylistLibraryQuery } from './queries'

export const useLibraries = () => useQuery(LibrariesQuery())

export const usePlaylistLibrary = () => useQuery(PlaylistLibraryQuery())
