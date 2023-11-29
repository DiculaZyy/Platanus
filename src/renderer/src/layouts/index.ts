import { DataNode } from 'src/stores/datanode'

const DefaultConfig = {
  layered: false,
  direction: 'RIGHT' as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  minSize: {
    width: 200,
    height: 40
  },
  minMargin: {
    parent: 60,
    child: 30,
    sibling: 20
  },
  origin: {
    x: 0,
    y: 0
  }
}

type Config = typeof DefaultConfig
export type CustomConfig = Partial<Config>

const getDefaultConfig = (): Config => {
  return JSON.parse(JSON.stringify(DefaultConfig))
}

class Tree {
  constructor(public node: DataNode, config: Config, maxLengthV = [] as number[], level = 0) {
    this.width = Math.max(config.minSize.width, this.node.displaySettings.graph.width)
    this.height = Math.max(config.minSize.height, this.node.displaySettings.graph.height)
    if (config.direction == 'RIGHT' || config.direction == 'LEFT') {
      this.innerLengthH = this.height
      this.innerLengthV = this.width
    } else {
      this.innerLengthH = this.width
      this.innerLengthV = this.height
    }
    this.lengthH = this.innerLengthH + 2 * config.minMargin.sibling
    this.lengthV = this.innerLengthV + config.minMargin.parent + config.minMargin.child
    maxLengthV[level] = Math.max(maxLengthV[level] || 0, this.lengthV)
    this.children = this.node.children
      .filter((child) => child.displaySettings.graph.show)
      .map((child) => new Tree(child, config, maxLengthV, level + 1))
  }
  set(config: Config, translation?: { x: number; y: number }): void {
    const rotate = ((): ((
      x: number,
      y: number
    ) => {
      x: number
      y: number
    }) => {
      if (config.direction == 'DOWN')
        return (x, y) => {
          return { x: x, y: y }
        }
      else if (config.direction == 'RIGHT')
        return (x, y) => {
          return { x: y, y: x }
        }
      else if (config.direction == 'UP')
        return (x, y) => {
          return { x: -x, y: -y }
        }
      else
        return (x, y) => {
          return { x: -y, y: -x }
        }
    })()
    const x = this.coordH + this.lengthH / 2
    const y = this.coordV + config.minMargin.parent + this.innerLengthV / 2
    const center = rotate(x, y)
    if (translation === undefined) {
      translation = {
        x: config.origin.x - center.x,
        y: config.origin.y - center.y
      }
    }
    const translate = (v: {
      x: number
      y: number
    }): {
      x: number
      y: number
    } => {
      return {
        x: v.x + translation!.x,
        y: v.y + translation!.y
      }
    }
    this.node.displaySettings.graph = {
      x: center.x + translation.x,
      y: center.y + translation.y,
      width: this.width,
      height: this.height,
      show: true,
      anchor: {
        parent: translate(rotate(x, this.coordV + config.minMargin.parent)),
        child: translate(rotate(x, this.coordV + config.minMargin.parent + this.innerLengthV)),
        head: translate(rotate(x, this.coordV)),
        tail: translate(rotate(x, this.coordV + this.lengthV))
      }
    }
    this.children.forEach((child) => child.set(config, translation))
  }
  width: number
  height: number
  innerLengthH: number
  innerLengthV: number
  /** Array of Children */
  children: Tree[]
  /** Horizontal Length */
  lengthH: number
  /** Vertical Length */
  lengthV: number
  /** Horizontal Coordinate */
  coordH = 0
  /** Vertical Coordinate */
  coordV = 0
  /** Preliminary Horizontal Coordinate */
  prelim = 0
  /** Modifier for the Entire Subtree */
  mod = 0
  /** Shift */
  shift = 0
  /** Change */
  change = 0
  /** Extreme Left Node */
  exL = this
  /** Extreme Right Node */
  exR = this
  /** Sum of Modifiers at the Extreme Left Node */
  modSumExL = 0
  /** Sum of Modifiers at the Extreme Right Node */
  modSumExR = 0
  /** The Reference to the Next Node in the Right Contour if the Node is a Leaf */
  threadR: Tree | null = null
  /** The Reference to the Next Node in the Left Contour if the Node is a Leaf */
  threadL: Tree | null = null
  get bottom(): number {
    return this.coordV + this.lengthV
  }
  get left(): Tree | null {
    return this.children.length === 0 ? this.threadL : this.children[0] || null
  }
  get right(): Tree | null {
    return this.children.length === 0
      ? this.threadR
      : this.children[this.children.length - 1] || null
  }
}

const setLengthV = (v: Tree, maxLengthV: number[], level = 0): void => {
  v.lengthV = maxLengthV[level]
  v.children.forEach((w) => {
    setLengthV(w, maxLengthV, level + 1)
  })
}

class Ancestor {
  constructor(public lowest: number, public index: number, public nxt: Ancestor | null) {
    while (this.nxt != null && this.lowest >= this.nxt.lowest) this.nxt = this.nxt.nxt
  }
}

const moveSubtree = (v: Tree, index: number, si: number, dist: number): void => {
  v.children[index].mod += dist
  v.children[index].modSumExL += dist
  v.children[index].modSumExR += dist
  if (index - si > 1) {
    const n = index - si
    v.children[si + 1].shift += dist / n
    v.children[index].shift -= dist / n
    v.children[index].change -= dist - dist / n
  }
}

const separate = (v: Tree, index: number, ancestor: Ancestor): void => {
  let contourSibsR: Tree | null = v.children[index - 1]
  let contourCurrL: Tree | null = v.children[index]
  let modSumSibsR = v.children[index - 1].mod
  let modSumCurrL = v.children[index].mod
  while (contourSibsR != null && contourCurrL != null) {
    if (contourSibsR.bottom > ancestor.lowest) ancestor = ancestor.nxt!
    const dist =
      modSumSibsR + contourSibsR.prelim + contourSibsR.lengthH - (modSumCurrL + contourCurrL.prelim)
    if (dist > 0) {
      modSumCurrL += dist
      moveSubtree(v, index, ancestor.index, dist)
    }
    const bottomSibs = contourSibsR.bottom
    const bottomCurr = contourCurrL.bottom
    if (bottomSibs <= bottomCurr) {
      contourSibsR = contourSibsR.right
      if (contourSibsR != null) modSumSibsR += contourSibsR.mod
    }
    if (bottomSibs >= bottomCurr) {
      contourCurrL = contourCurrL.left
      if (contourCurrL != null) modSumCurrL += contourCurrL.mod
    }
  }
  if (contourSibsR == null && contourCurrL != null) {
    const contourL = v.children[0].exL
    contourL.threadL = contourCurrL
    const diff = modSumCurrL - contourCurrL.mod - v.children[0].modSumExL
    contourL.mod += diff
    contourL.prelim -= diff
    v.children[0].exL = v.children[index].exL
    v.children[0].modSumExL = v.children[index].modSumExL
  } else if (contourSibsR != null && contourCurrL == null) {
    const contourR = v.children[index].exR
    contourR.threadR = contourSibsR
    const diff = modSumSibsR - contourSibsR.mod - v.children[index].modSumExR
    contourR.mod += diff
    contourR.prelim -= diff
    v.children[index].exR = v.children[index - 1].exR
    v.children[index].modSumExR = v.children[index - 1].modSumExR
  }
}

const firstWalk = (v: Tree): void => {
  if (v.children.length > 0) {
    v.children[0].coordV = v.bottom
    firstWalk(v.children[0])
    let ancestor = new Ancestor(v.children[0].exL.bottom, 0, null)
    for (let i = 1; i < v.children.length; i++) {
      v.children[i].coordV = v.bottom
      firstWalk(v.children[i])
      const lowest = v.children[i].exR.bottom
      separate(v, i, ancestor)
      ancestor = new Ancestor(lowest, i, ancestor)
    }
    v.prelim =
      (v.left!.prelim + v.left!.mod + v.right!.prelim + v.right!.mod + v.right!.lengthH) / 2 -
      v.lengthH / 2
    v.exL = v.left!.exL
    v.modSumExL = v.left!.modSumExL
    v.exR = v.right!.exR
    v.modSumExR = v.right!.modSumExR
  }
}

const addChildSpacing = (v: Tree): void => {
  let d = 0
  let modSumDelta = 0
  for (const w of v.children) {
    d += w.shift
    modSumDelta += d + w.change
    w.mod += modSumDelta
  }
}

const secondWalk = (v: Tree, modSum = 0): void => {
  modSum += v.mod
  v.coordH = v.prelim + modSum
  addChildSpacing(v)
  v.children.forEach((w) => {
    secondWalk(w, modSum)
  })
}

export const layout = (node: DataNode, settings?: CustomConfig): void => {
  const config = getDefaultConfig()
  for (const setting in settings) {
    config[setting] = settings[setting]
  }
  const maxLengthV = [] as number[]
  const tree = new Tree(node, config, maxLengthV)
  if (config.layered) setLengthV(tree, maxLengthV)
  firstWalk(tree)
  secondWalk(tree)
  tree.set(config)
}
