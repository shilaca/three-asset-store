import { LoaderSettings } from '../libs/loader'

/**
 * The types of message and response are paired
 * */

export type LoaderWorkerMessageData =
  | LoaderWorkerMessageInitializeData
  | LoaderWorkerMessageLoadData
export type LoaderWorkerMessageDataType = Pick<
  LoaderWorkerMessageData,
  'type'
>['type']
export interface LoaderWorkerMessageInitializeData {
  type: 'initialize'
  settings: LoaderSettings
}
export interface LoaderWorkerMessageLoadData {
  type: 'load'
  url: string
  content: any
}

export type LoaderWorkerResponseData =
  | LoaderWorkerResponseInitializeData
  | LoaderWorkerResponseLoadData
  | LoaderWorkerResponseErrorData
export interface LoaderWorkerResponseInitializeData {
  type: 'initialize'
}
export interface LoaderWorkerResponseLoadData {
  type: 'load'
  url: string
  content: any
}
export interface LoaderWorkerResponseErrorData {
  type: 'error'
  error: any
}
