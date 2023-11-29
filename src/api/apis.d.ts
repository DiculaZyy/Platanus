import type * as DataTypes from './datatypes'

export type Apis =
  | {
      name: 'access'
      request: DataTypes.Dir
      response: boolean
    }
  | {
      name: 'getFileInfo'
      request: DataTypes.Dir
      response: DataTypes.FileInfo
    }
  | {
      name: 'getSubfilesAmount'
      request: DataTypes.Dir
      response: number
    }
  | {
      name: 'getSubfiles'
      request: DataTypes.Dir
      response: DataTypes.FileInfo[]
    }

type _ApiNames<API> = API extends { name: infer T } ? T : never
type _ApiRequest<API, T> = API extends { name: T; request: infer R } ? R : never
type _ApiResponse<API, T> = API extends { name: T; response: infer R } ? R : never

export type ApiNames = _ApiNames<Apis>

type ApiRequest<T extends ApiNames> = _ApiRequest<Apis, T>
type ApiResponse<T extends ApiNames> = _ApiResponse<Apis, T>

export type ApiHandlers = {
  [key in ApiNames]: (request: ApiRequest<key>) => Promise<ApiResponse<key>>
}
