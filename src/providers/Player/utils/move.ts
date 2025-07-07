import JellifyTrack from '../../../types/JellifyTrack'

const move = (queue: JellifyTrack[], from: number, to: number): JellifyTrack[] => {
	const queueCopy = [...queue]

	const movedTrack = queueCopy.splice(from, 1)[0]
	queueCopy.splice(to, 0, movedTrack)
	return queueCopy
}

export default move
