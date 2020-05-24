export interface LoaderWorkerMessageInitializeData {
  type: 'initialize',
  settings?: Partial<{
    rootDir: string
  }>,
  state: 'start' | 'end'
}
export interface LoaderWorkerMessageLoadData {
  type: 'load'
  url: string
  content: any
}

export interface LoaderWorkerMessageErrorData {
  type: 'error'
  error: any
}

export type LoaderWorkerMessageData =
  | LoaderWorkerMessageInitializeData
  | LoaderWorkerMessageLoadData
  | LoaderWorkerMessageErrorData
export type LoaderWorkerMessageDataType = Pick<LoaderWorkerMessageData, 'type'>['type']