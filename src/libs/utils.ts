import * as IDB from './indexedDB'
import { AssetLoader } from './loader'
import { REGEXP_SAVE_BLOB } from '../constants'
import { Asset } from '../models/assetStore'

/**
 *
 * @param dbName
 * @param storeName
 * @returns database version number
 */
export function initializeIndexedDB(
  dbName: string,
  storeName: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const openReq = IDB.open(dbName)
    openReq.onupgradeneeded = event => {
      const db = (<IDBRequest<IDBDatabase>>event.target).result
      db.createObjectStore(storeName, { keyPath: 'url' })
    }
    openReq.onsuccess = event => {
      const db = (<IDBRequest<IDBDatabase>>event.target).result
      resolve(db.version)
    }
    openReq.onerror = event => {
      const error = <IDBRequest>event.target
      reject(error)
    }
  })
}

export function saveToDB<T>(
  asset: Asset<T>,
  canIDB: boolean,
  dbName: string,
  storeName: string
): Promise<Asset<T>> {
  return canIDB
    ? IDB.put(dbName, storeName, asset).then(_ => asset)
    : Promise.resolve(asset)
}

export async function getFromDB<T>(
  url: string,
  canIDB: boolean,
  dbName: string,
  storeName: string
): Promise<Asset<T>> {
  if (canIDB) {
    const asset = await IDB.get(dbName, storeName, url).catch(error =>
      Promise.reject(error)
    )
    console.log('idb', asset)
    return Promise.resolve(asset)
  } else {
    return Promise.reject(new Error(`IndexedDB is not available.`))
  }
}

function toBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'blob'
    xhr.onload = () => {
      resolve(xhr.response)
    }
    xhr.onerror = err => reject(err)
    xhr.open('GET', url)
    xhr.send()
  })
}

export async function loadAsset<T>(
  url: string,
  loader: AssetLoader | undefined,
  canIDB: boolean,
  dbName: string,
  storeName: string
): Promise<T> {
  if (!loader) {
    return Promise.reject(
      new Error(
        `Can not get an Asset. May have failed to initialize this store.`
      )
    )
  }

  const isBlob = REGEXP_SAVE_BLOB.test(url)
  if (canIDB && isBlob) {
    const _asset = await getFromDB<Blob>(url, canIDB, dbName, storeName)
    const blob = _asset ? _asset.content : await toBlob(url)
    if (!_asset) {
      await saveToDB(
        { url, content: blob },
        canIDB,
        dbName,
        storeName
      ).catch(err => console.warn(err))
    }
    // const file = new File([blob], 'url')
    console.log(_asset, blob)
    const blobURL = URL.createObjectURL(blob)
    return loader.load<T>(blobURL, {
      isBlob: true,
      extensions: url.split('.').slice(-1)[0]
    })
  } else {
    return loader.load<T>(url).then(async content => {
      if (canIDB)
        await saveToDB({ url, content }, canIDB, dbName, storeName).catch(err =>
          console.warn(err)
        )
      return content
    })
  }
}
