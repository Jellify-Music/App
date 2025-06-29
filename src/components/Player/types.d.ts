import { QueuingType } from '../../enums/queuing-type'
import JellifyTrack from '../../types/JellifyTrack'

export type Item = JellifyTrack

export type Section = {
	title: QueuingType
	data: Item[]
}
