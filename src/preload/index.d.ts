import { ElectronAPI } from '@electron-toolkit/preload'

import type { ApiHandlers } from '../api/apis'

import type * as path from 'path'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ApiHandlers
    path: {
      basename: typeof path.basename
      delimiter: typeof path.delimiter
      dirname: typeof path.dirname
      extname: typeof path.extname
      format: typeof path.format
      isAbsolute: typeof path.isAbsolute
      join: typeof path.join
      normalize: typeof path.normalize
      parse: typeof path.parse
      posix: typeof path.posix
      relative: typeof path.relative
      resolve: typeof path.resolve
      sep: typeof path.sep
      toNamespacedPath: typeof path.toNamespacedPath
      win32: typeof path.win32
    }
  }
}
