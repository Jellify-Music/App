import {createMMKV} from 'react-native-mmkv'
import { MMKVStorageKeys } from '../../../enums/mmkv-storage-keys'
const storage = createMMKV()
const isSetupCompleted = () => {
    return storage.getBoolean(MMKVStorageKeys.SetupCompleted)
}

const setSetupCompleted = () => {
    storage.set(MMKVStorageKeys.SetupCompleted, true)
}

const baseScreen = isSetupCompleted() ? 'Tabs' : 'Setup'

export { isSetupCompleted,setSetupCompleted,baseScreen }