import * as fs from 'fs/promises'
import * as path from 'path'

import type { ApiHandlers } from '../api/apis'
import type { FileType } from '../api/datatypes'

const getFileType = <
  T extends {
    isFile: () => boolean
    isDirectory: () => boolean
    isSymbolicLink: () => boolean
  }
>(
  file: T
): FileType => {
  if (file.isFile()) return 'file'
  else if (file.isDirectory()) return 'folder'
  else if (file.isSymbolicLink()) return 'symboliclink'
  else return 'unknown'
}

const handlers: ApiHandlers = {
  access: async (req) => {
    try {
      await fs.access(req.dir)
      return true
    } catch {
      return false
    }
  },
  getFileInfo: async (req) => {
    const stat = await fs.lstat(req.dir)
    return {
      name: path.basename(req.dir),
      type: getFileType(stat)
    }
  },
  getSubfilesAmount: async (req) => {
    const dir = path.normalize(req.dir)
    return (await fs.readdir(dir, { withFileTypes: true })).length
  },
  getSubfiles: async (req) => {
    const dir = path.normalize(req.dir)
    return (await fs.readdir(dir, { withFileTypes: true })).map((subfile) => {
      return {
        name: subfile.name,
        type: getFileType(subfile)
      }
    })
  }
}

export default handlers
