export function open(name: string, version?: number): IDBOpenDBRequest {
  return indexedDB.open(name, version)
}

function connect(name: string): Promise<IDBDatabase> {
  const req = open(name)
  return new Promise((resolve, reject) => {
    req.onsuccess = event =>
      resolve((<IDBRequest<IDBDatabase>>event.target).result)
    req.onerror = event => reject(event.target)
  })
}

// TODO: post

export function put(
  dbName: string,
  storeName: string,
  data: any
): Promise<void> {
  return connect(dbName).then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite')
        const store = transaction.objectStore(storeName)
        const req = store.put(data)

        req.onsuccess = event =>
          console.log('IndexedDB PUT success: ', event.target)
        req.onerror = event => reject(event.target)

        transaction.oncomplete = event => {
          console.log(`IndexedDB PUT complete: `, event.target)
          resolve()
        }
        transaction.onerror = error => reject(error)
      })
  )
}

export function get(
  dbName: string,
  storeName: string,
  keyValue: string | number | Date | ArrayBufferView | ArrayBuffer | IDBKeyRange
): Promise<any> {
  return connect(dbName).then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        const req = store.get(keyValue)

        let data: any
        req.onsuccess = event => {
          console.log(`IndexedDB GET success: `, event.target)
          data = (<IDBRequest<any>>event.target).result
        }
        req.onerror = event => reject(event.target)

        transaction.oncomplete = event => {
          console.log(`IndexedDB GET complete: `, event.target)
          resolve(data)
        }
        transaction.onerror = event => reject(event.target)
      })
  )
}

export function del(
  dbName: string,
  storeName: string,
  keyValue: string | number | Date | ArrayBufferView | ArrayBuffer | IDBKeyRange
): Promise<void> {
  return connect(dbName).then(
    db =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly')
        const store = transaction.objectStore(storeName)
        const req = store.delete(keyValue)

        req.onsuccess = event => {
          console.log(`IndexedDB DELETE success: `, event.target)
        }
        req.onerror = event => reject(event.target)

        transaction.oncomplete = event => {
          console.log(`IndexedDB DELETE complete: `, event.target)
          resolve()
        }
        transaction.onerror = event => reject(event.target)
      })
  )
}
