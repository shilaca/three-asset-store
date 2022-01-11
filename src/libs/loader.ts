import { Loader, ImageBitmapLoader } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module'

interface _Loader extends Loader {
  load: (
    url: string,
    onLoad: (asset: any) => void,
    onProgress?: (xhr: ProgressEvent<EventTarget>) => void,
    onError?: (error: ErrorEvent) => void
  ) => void
}

export interface LoaderSettings {
  dracoDir: string
}

interface LoadOptions {
  isBlob: boolean
  extensions: string
}

export class AssetLoader {
  private dracoDir: string

  private _imageBitmapLoader: ImageBitmapLoader | undefined
  private get imageBitmapLoader(): ImageBitmapLoader {
    if (!this._imageBitmapLoader) {
      this._imageBitmapLoader = new ImageBitmapLoader()
      this._imageBitmapLoader.setOptions({ imageOrientation: 'flipY' })
    }
    return this._imageBitmapLoader
  }

  private _gltfLoader: GLTFLoader | undefined
  private get gltfLoader(): GLTFLoader {
    if (!this._gltfLoader) {
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath(this.dracoDir)
      this._gltfLoader = new GLTFLoader()
        .setDRACOLoader(dracoLoader)
        .setMeshoptDecoder(MeshoptDecoder)
    }
    return this._gltfLoader
  }

  constructor(settings: LoaderSettings) {
    this.dracoDir = settings.dracoDir
  }

  load<T>(url: string, loadOptions?: Partial<LoadOptions>): Promise<T> {
    const extension = loadOptions?.isBlob
      ? loadOptions.extensions || ''
      : url.split('.').slice(-1)[0]
    return this.getLoader(extension).then(
      loader =>
        new Promise((resolve, reject) =>
          loader.load(
            url,
            asset => resolve(asset),
            // xhr => console.log(xhr),
            error => reject(error)
          )
        )
    )
  }

  private getLoader(extension: string): Promise<_Loader> {
    return new Promise((resolve, reject) => {
      switch (extension) {
        case 'jpg':
        case 'png':
          resolve(this.imageBitmapLoader)
          break
        case 'glb':
        case 'gltf':
          resolve(this.gltfLoader)
          break

        default:
          reject(new Error(`The extension ${extension} is not supported.`))
      }
    })
  }
}
