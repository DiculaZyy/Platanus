export type FileType = 'file' | 'folder' | 'symboliclink' | 'shortcut' | 'unknown'

export interface Dir {
  dir: string
}

export interface FileInfo {
  name: string
  type: FileType
}
