import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { OrderedMap, LinkList } from 'js-sdsl'

import type { FileType } from '../../../api/datatypes'

type ID = string

export interface DisplaySettings {
  graph: {
    x: number
    y: number
    width: number
    height: number
    show: boolean
    anchor: {
      parent: {
        x: number
        y: number
      }
      child: {
        x: number
        y: number
      }
      head: {
        x: number
        y: number
      }
      tail: {
        x: number
        y: number
      }
    }
  }
  tree: {
    show: boolean
  }
}

export const defaultDisplaySettings = (): DisplaySettings => {
  return {
    graph: {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      show: false,
      anchor: {
        parent: { x: 0, y: 0 },
        child: { x: 0, y: 0 },
        head: { x: 0, y: 0 },
        tail: { x: 0, y: 0 }
      }
    },
    tree: {
      show: true
    }
  }
}

type CustomSettings = {
  [key in keyof DisplaySettings]?: Partial<DisplaySettings[key]>
}

export class DataNode {
  displaySettings: DisplaySettings
  subfileCount: number
  subfiles?: DataNode[]
  constructor(
    public readonly id: ID,
    public name: string,
    public type: FileType,
    public parentDir: string | DataNode,
    displaySettings?: CustomSettings
  ) {
    this.subfileCount = 0
    this.displaySettings = defaultDisplaySettings()
    for (const group in displaySettings) {
      for (const setting in displaySettings[group])
        this.displaySettings[group][setting] = displaySettings[group][setting]
    }
  }
  get path(): string {
    return window.path.join(
      this.parentDir instanceof DataNode ? this.parentDir.path : this.parentDir,
      this.name
    )
  }
  walkto(route: string): DataNode | undefined {
    route = window.path.normalize(route)
    if (route === '.') return this
    const name = route.split(window.path.sep, 1)[0]
    const subRoute = window.path.relative(name, route)
    return this.subfiles?.find((item) => item.name === name)?.walkto(subRoute)
  }
  get parents(): DataNode[] {
    return this.parentDir instanceof DataNode ? [this.parentDir] : []
  }
  get children(): DataNode[] {
    return this.subfiles || []
  }
}

type InteriorNode = {
  route: string
  node?: DataNode
}

class RootDir {
  nodes: LinkList<DataNode>
  constructor(...nodes: DataNode[]) {
    this.nodes = new LinkList<DataNode>(nodes)
  }
  add(node: DataNode): void {
    this.nodes.pushBack(node)
  }
  match(route: string): InteriorNode {
    for (const node of this.nodes) {
      const subRoute = window.path.relative(node.name, route)
      if (!subRoute.startsWith('..'))
        return {
          route: subRoute,
          node: node
        }
    }
    return {
      route: route
    }
  }
  toArray(): DataNode[] {
    const arr = [] as ReturnType<typeof this.toArray>
    for (const n of this.nodes) {
      arr.push(n)
    }
    return arr
  }
}

class RootDirList {
  list = new OrderedMap<string, RootDir>([], (x, y) => y.localeCompare(x))
  find(dir: string): RootDir | undefined {
    return this.list.getElementByKey(dir)
  }
  match(dir: string): InteriorNode {
    const it = this.list.lowerBound(dir)
    if (!it.equals(this.list.end())) {
      const [rootDir, nodes] = it.pointer
      const route = window.path.relative(rootDir, dir)
      if (!route.startsWith('..')) return nodes.match(route)
    }
    return {
      route: dir
    }
  }
  add(node: DataNode): void {
    const dir = window.path.dirname(node.path)
    const rootnode = this.find(dir)
    if (rootnode) {
      rootnode.add(node)
    } else {
      this.list.setElement(dir, new RootDir(node))
    }
  }
  remove(dir: string, func: (element: DataNode) => void): number {
    const it = this.list.find(dir)
    let cnt = 0
    if (!it.equals(this.list.end())) {
      it.pointer[1].nodes.sort((x, y) => x.name.localeCompare(y.name))
      it.pointer[1].nodes.forEach(func)
      cnt = it.pointer[1].nodes.length
      this.list.eraseElementByIterator(it)
    }
    return cnt
  }
  toArray(): {
    dir: string
    nodes: DataNode[]
  }[] {
    const arr = [] as ReturnType<typeof this.toArray>
    for (const r of this.list) {
      arr.push({
        dir: r[0],
        nodes: r[1].toArray()
      })
    }
    return arr
  }
  clear(): void {
    this.list.clear()
  }
}

class DataNodeList {
  list = new Map<ID, DataNode>()
  get(id: ID): DataNode | undefined {
    return this.list.get(id)
  }
  clear(): void {
    this.list.clear()
  }
}

export const useDataNodeStore = defineStore('datanode', {
  state: () => ({
    rootdirs: new RootDirList(),
    datanodes: new DataNodeList()
  }),
  getters: {
    getByID(state) {
      return async (id: ID): Promise<DataNode | undefined> => {
        return state.datanodes.get(id)
      }
    },
    getByDir(state) {
      return async (dir: string): Promise<DataNode | undefined> => {
        dir = window.path.normalize(dir)
        if (!window.path.isAbsolute(dir)) throw `Finding DataNode: ${dir} is not an absolue path!`
        const { route, node } = state.rootdirs.match(dir)
        return node?.walkto(route)
      }
    }
  },
  actions: {
    async open(dir: string, displaySettings?: CustomSettings): Promise<DataNode> {
      const node = await this.getByDir(dir)
      if (node) return node
      const info = await window.api.getFileInfo({ dir: dir })
      if (!info) throw `Cannot access ${dir}`
      const parentDir = window.path.dirname(dir)
      const parent = await this.getByDir(parentDir)
      const newNode = await this.create(info.name, info.type, parent || parentDir, displaySettings)
      return newNode
    },
    async fetchSubfiles(id: ID, displaySettings: CustomSettings) {
      const node = await this.getByID(id)
      if (!node) throw 'Invalid ID'
      if (node.type === 'folder') {
        const subfiles = await window.api.getSubfiles({ dir: node.path })
        node.subfileCount = subfiles.length
        const existedNodes = node.subfiles || []
        for (const file of subfiles) {
          if (!existedNodes.find((val) => val.name === file.name)) {
            await this.create(file.name, file.type, node, displaySettings)
          }
        }
        node.subfiles!.sort((x, y) => x.name.localeCompare(y.name))
      }
    },
    async create(
      name: string,
      type: FileType,
      parentDir: string | DataNode,
      displaySettings?: CustomSettings
    ): Promise<DataNode> {
      let id = nanoid()
      while (this.datanodes.list.has(id)) id = nanoid()
      const newNode = new DataNode(id, name, type, parentDir, displaySettings)
      if (newNode.type === 'folder') {
        newNode.subfileCount = await window.api.getSubfilesAmount({ dir: newNode.path })
        newNode.subfiles = []
      }
      if (newNode.parentDir instanceof DataNode) newNode.parentDir.subfiles!.push(newNode)
      else this.rootdirs.add(newNode)
      this.datanodes.list.set(newNode.id, newNode)
      this.rootdirs.remove(newNode.path, (elem) => {
        elem.parentDir = newNode
        newNode.subfiles = newNode.subfiles || []
        newNode.subfiles.push(elem)
      })
      return newNode
    },
    async clear() {
      this.rootdirs.clear()
      this.datanodes.clear()
    }
  }
})
