import { QueuingType } from '../../../enums/queuing-type'
import JellifyTrack from '../../../types/JellifyTrack'
import { fetchManuallyQueuedTracks } from './queue'
import { loadTensorflowModel } from 'react-native-fast-tflite'

export function shuffleJellifyTracks(tracks: JellifyTrack[]): {
	shuffled: JellifyTrack[]
	manuallyQueued: JellifyTrack[]
	original: JellifyTrack[]
} {
	// Make a copy to avoid mutating the original array, filtering out manually queued tracks
	const shuffled = [...tracks.filter((track) => track.QueuingType === QueuingType.FromSelection)]

	const manuallyQueued = fetchManuallyQueuedTracks(tracks)

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
	}

	return { shuffled, manuallyQueued, original: tracks }
}


export const getRecommendedTracks = async (tracks: JellifyTrack[]) => {
	const model = await loadTensorflowModel({
		url: "https://raw.githubusercontent.com/riteshshukla04/PokeDex/refs/heads/master/smart_music_recommendation_v2.tflite"
	})
	const extractFeatures = (track:any) => {
		const item = track.item;
		const userData = item.UserData;
		
		const isFavorite = userData.IsFavorite ? 1 : 0;
		const durationSecs = track.duration / 1e7; // Convert from ticks to seconds
		
		// Calculate days since last played
		const lastPlayed = userData.LastPlayedDate || '2000-01-01T00:00:00.0000000Z';
		const lastPlayedDate = new Date(lastPlayed.split('.')[0]) as any;
		const now = new Date();
		const daysSincePlayed = Math.floor((now as any - lastPlayedDate ) / (1000 * 60 * 60 * 24));
		console.log(daysSincePlayed,"daysSincePlayed")
	
		return [1, durationSecs, daysSincePlayed];
	  };

	
	
		// Score and sort
		const scoredTracks = tracks.map(async(track) => {
	  
		  const inputTensor = new Float32Array(extractFeatures(track));
		  console.log(inputTensor,"inputTensor")
		  const result = await model.run([inputTensor]); // 1 output neuron
		  const score = result[0];
		  return { ...track, _score: score[0] };
		});
		const scoredTracksss = await Promise.all(scoredTracks)
		const weightedShuffled = weightedShuffle(scoredTracksss)
		return weightedShuffled
	
		
	  
}

function weightedShuffle(tracks:JellifyTrack[]) {
	const arr = [...tracks]; // Clone the array to avoid mutating input
  
	for (let i = arr.length - 1; i > 0; i--) {
	  // Bias: higher _score means higher chance to stay near the top
	  // Calculate a weight array based on inverse distance to current index
	  const weights = arr.slice(0, i + 1).map(track => track._score || 0);
	  const totalWeight = weights.reduce((a, b) => a + b, 0);
	  let rand = Math.random() * totalWeight;
  
	  let j = 0;
	  for (; j <= i; j++) {
		rand -= weights[j];
		if (rand <= 0) break;
	  }
  
	  // Swap i and j
	  [arr[i], arr[j]] = [arr[j], arr[i]];
	}
  
	return arr;
  }