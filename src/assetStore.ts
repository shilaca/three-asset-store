import { AssetLoader } from './libs/loader'
import Worker from './workers/loader.worker'
import {
  LoaderWorkerMessageDataType,
  LoaderWorkerMessageData,
  LoaderWorkerMessageInitializeData,
  LoaderWorkerMessageLoadData,
  LoaderWorkerResponseData
} from './models/loader'
import { initializeIndexedDB, loadAsset, getFromDB } from './libs/utils'
import {
  INDEXED_DATABASE_DEFAULT_NAME,
  INDEXED_DATABASE_ASSET_STORE_NAME,
  REGEXP_SAVE_BLOB,
  REGEXP_UNUSABLE_WORKER
} from './constants'
import { Asset } from './models/assetStore'

interface AssetStoreSettings {
  dracoDir: string
  useIDB?: boolean
  dbName?: string
}

interface LoadParameters {
  idbTarget: 'blob' | 'arrayBuffer'
}

export class AssetStore {
  private assets: Asset<any>[]
  private initialized: boolean

  private canWorker: boolean
  private readonly workerTimeout: number = 300000
  private loaderWorker: Worker | undefined
  private loader: AssetLoader | undefined

  private canIDB: boolean
  private dbName: string
  private dbVersion: number | undefined
  private readonly assetStoreName: string = INDEXED_DATABASE_ASSET_STORE_NAME

  constructor(private settings: AssetStoreSettings) {
    this.canWorker = 'Worker' in globalThis
    // this.canWorker = false

    this.canIDB = !!settings.useIDB && 'indexedDB' in globalThis
    this.dbName = this.settings?.dbName || INDEXED_DATABASE_DEFAULT_NAME

    this.assets = []
    this.initialized = false
  }

  initialize(): Promise<void> {
    const initIDB = () =>
      this.canIDB
        ? initializeIndexedDB(this.dbName, this.assetStoreName).then(
            version => {
              this.dbVersion = version
              return undefined
            }
          )
        : Promise.resolve()

    const initializeLoader: () => Promise<void> = () =>
      new Promise((resolve, reject) => {
        this.loader = new AssetLoader(this.settings)
        if (!this.canWorker) {
          return resolve()
        }
        try {
          this.loaderWorker = new Worker()
          this.loaderWorker.addEventListener(
            'message',
            this.ordinaryOnMessageFormLoaderWorker
          )
          const data: LoaderWorkerMessageInitializeData = {
            type: 'initialize',
            settings: this.settings
          }
          this.loaderWorker.postMessage(data)
          this.getOneMessageFromLoaderWorker('initialize')
            .then(_ => resolve())
            .catch(error => reject(error))
          return
        } catch (error) {
          return reject(error)
        }
      })

    return Promise.all([initIDB(), initializeLoader()]).then(() => {
      this.initialized = true
    })
  }

  getAsset<T>(url: string): T | undefined {
    return this.assets.find(asset => asset.url === url)?.content as T
  }

  setAsset<T>(asset: Asset<T>): void {
    this.assets.push(asset)
  }

  async getOrLoadAsset<T>(url: string): Promise<T> {
    // When saved
    const asset = this.getAsset<T>(url)
    if (asset) return Promise.resolve(asset)

    // When IndexedDB is available and saved
    if (this.canIDB && !REGEXP_SAVE_BLOB.test(url)) {
      const asset = await getFromDB<T>(
        url,
        this.canIDB,
        this.dbName,
        this.assetStoreName
      ).catch(err => console.warn(err))
      if (asset) {
        this.setAsset(asset)
        return Promise.resolve(asset.content)
      }
    }

    // When Worker is available
    // Load assets in worker
    if (this.loaderWorker && !REGEXP_UNUSABLE_WORKER.test(url)) {
      const data: LoaderWorkerMessageLoadData = {
        type: 'load',
        url,
        content: null
      }
      this.loaderWorker.postMessage(data)
      const result = await this.getOneMessageFromLoaderWorker('load')
      if (result && result.type === 'load' && result.content) {
        const content = result.content
        const asset = { url, content }
        this.setAsset(asset)
        // return this.saveAssetToDB(asset).then(_ => content)
        return Promise.resolve(content)
      }
    }

    // Load assets in local
    if (this.loader) {
      return loadAsset<T>(
        url,
        this.loader,
        this.canIDB,
        this.dbName,
        this.assetStoreName
      ).then(content => {
        this.setAsset({ url, content })
        return content
      })
    }

    // Error
    return Promise.reject(
      new Error(
        `Can not get an Asset. May have failed to initialize this store.`
      )
    )
  }

  /// // For worker function
  private ordinaryOnMessageFormLoaderWorker(event: MessageEvent): void {
    const data = event.data
    const type: string = data.type

    switch (type) {
      case '':
        break

      default:
        break
    }
  }

  /**
   * Worker からメッセージを受け取る
   * @param type data object に付与されている type
   * @param count メッセージを受け取る回数
   */
  private getOneMessageFromLoaderWorker(
    type: LoaderWorkerMessageDataType
  ): Promise<LoaderWorkerResponseData | void> {
    let func: (event: MessageEvent) => void
    let id: ReturnType<typeof setTimeout> | null

    return new Promise<LoaderWorkerResponseData | void>((resolve, reject) => {
      if (!this.loaderWorker) return resolve()
      const _func = (event: MessageEvent): void => {
        if (event.data.type === type) {
          resolve(event.data)
        }
      }
      func = _func
      this.loaderWorker.addEventListener('message', func)
      id = setTimeout(() => {
        reject(
          new Error(
            `Timeout Error: Did not get a type ${type} message from LoaderWorker.`
          )
        )
      }, this.workerTimeout)
    }).then(data => {
      this.loaderWorker &&
        this.loaderWorker.removeEventListener('message', func)
      if (id) {
        clearTimeout(id)
        id = null
      }
      return data
    })
  }
}
