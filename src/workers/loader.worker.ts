import { AssetLoader } from '../libs/loader'
import {
  LoaderWorkerMessageData,
  LoaderWorkerResponseData,
  LoaderWorkerResponseErrorData,
  LoaderWorkerResponseLoadData
} from '../models/loader'
import {
  INDEXED_DATABASE_DEFAULT_NAME,
  INDEXED_DATABASE_ASSET_STORE_NAME
} from '../constants'
import { initializeIndexedDB, loadAsset } from '../libs/utils'

export default {} as typeof Worker & (new () => Worker)

const canIDB = 'indexedDB' in globalThis
const dbName = INDEXED_DATABASE_DEFAULT_NAME
const assetStoreName = INDEXED_DATABASE_ASSET_STORE_NAME
let dbVersion: number | undefined

let loader: AssetLoader | undefined

function initIDB() {
  return canIDB
    ? initializeIndexedDB(dbName, assetStoreName).then(version => {
        dbVersion = version
        return undefined
      })
    : Promise.resolve()
}

function errorData(error: any): LoaderWorkerResponseErrorData {
  return {
    type: 'error',
    error
  }
}

const ctx = globalThis

function response(
  data: LoaderWorkerResponseData,
  transfer: Transferable[] = []
): void {
  const options: any = transfer
  ctx.postMessage(data, options)
}

ctx.addEventListener('message', async (event: MessageEvent) => {
  const data: LoaderWorkerMessageData = event.data
  switch (data.type) {
    case 'initialize':
      loader = new AssetLoader(data.settings)
      initIDB().then(() => {
        response({ type: 'initialize' })
      })
      break

    case 'load':
      if (loader) {
        try {
          const content = await loadAsset<any>(
            data.url,
            loader,
            canIDB,
            dbName,
            assetStoreName
          )
          const result: LoaderWorkerResponseLoadData = {
            type: data.type,
            url: data.url,
            content
          }
          response(result)
        } catch (err) {
          console.error(err)
          response(errorData(err))
        }
      } else {
        response(errorData('Failed to initialize Loader'))
      }
      break

    // default:
    //   response(errorData(`type: ${data.type} is not defined`))
    //   break
  }
})
