import { AssetLoader } from '../libs/loader'
import {
  LoaderWorkerMessageData,
  LoaderWorkerMessageErrorData,
  LoaderWorkerMessageLoadData
} from '../models/loader'
import {
  INDEXED_DATABASE_DEFAULT_NAME,
  INDEXED_DATABASE_ASSET_STORE_NAME
} from '../constants'
import {
  initializeIndexedDB,
  loadAsset
} from '../libs/utils'

const canIDB = 'indexedDB' in globalThis
const dbName = INDEXED_DATABASE_DEFAULT_NAME
const assetStoreName = INDEXED_DATABASE_ASSET_STORE_NAME
let dbVersion: number | undefined

let loader: AssetLoader | undefined

const ctx: Worker = self as any
ctx.addEventListener('message', async (event: MessageEvent) => {
  const data: LoaderWorkerMessageData = event.data
  switch (data.type) {
    case 'initialize':
      loader = new AssetLoader(data.settings)
      initIDB().then(() => {
        ctx.postMessage({ type: data.type, state: 'end' })
      })
      break

    case 'load':
      if (loader) {
        console.log('load')

        try {
          const content = await loadAsset<any>(
            data.url,
            loader,
            canIDB,
            dbName,
            assetStoreName
          )
          const result: LoaderWorkerMessageLoadData = {
            type: data.type,
            url: data.url,
            content
          }
          console.log(content, result)
          ctx.postMessage(result)
        } catch (err) {
          console.error(err)
          ctx.postMessage(errorData(err))
        }
      } else {
        ctx.postMessage(errorData('Failed to initialize Loader'))
      }
      break

    default:
      ctx.postMessage(errorData(`type: ${data.type} is not defined`))
      break
  }
})

function errorData(error: any): LoaderWorkerMessageErrorData {
  return {
    type: 'error',
    error
  }
}

export default {} as typeof Worker & (new () => Worker)

/// // for IDB
function initIDB() {
  return canIDB
    ? initializeIndexedDB(dbName, assetStoreName).then(version => {
        dbVersion = version
        return undefined
      })
    : Promise.resolve()
}
