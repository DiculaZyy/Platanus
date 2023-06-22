import { FileObjNode } from "./fileobjnode";
import * as path from "path";
import * as chokidar from "chokidar";
import * as fs from "fs";

let rootnodes = [] as RootDirNode[];

export class RootDirNode {
    constructor(dir : string) {
        this.path = dir;
        this.watcher = chokidar.watch(this.path);
    }
    get name() {
        return path.basename(this.path);
    }
    readonly type = 'dir' as 'dir';
    readonly path : string;
    readonly data : undefined;
    walkto(route: string) {
        route = path.normalize(route);
        if (route === '.') return this;
        const name = route.split(path.sep, 1)[0];
        const subRoute = route.slice(name.length + path.sep.length);
        return this.children.find(item => item.name === name)?.walkto(subRoute)
    }
    children = [] as FileObjNode[];
    watcher : chokidar.FSWatcher;
}

export function find(dir : string) : RootDirNode | undefined {
    return rootnodes.find(item => item.path === dir)
}

export function match(dir : string) : RootDirNode | undefined {
    dir = path.normalize(dir);
    if (!path.isAbsolute(dir)) 
        throw `Finding DataNode: ${dir} is not an absolue path!`;
    let results = [] as RootDirNode[];
    for (const node of rootnodes) {
        if (dir.startsWith(node.path)) {
            results.push(node);
        }
    }
    if (results.length > 0)
        return results.reduce((acc, cur) =>
            (cur.path.length < acc.path.length) ? cur : acc);
    return ;
}

export function create(dir : string) : RootDirNode {
    dir = path.normalize(dir);
    let node = find(dir);
    if (node) {
        // logger.warn(`Creating RootDirNode: ${dir} has alreadly exist!`);
        console.warn(`Creating RootDirNode: ${dir} has alreadly exist!`);
        return node;
    }
    if (!fs.existsSync(dir)) {
        throw  `Dir ${dir} does not exist!`;
    }
    node = new RootDirNode(dir);
    rootnodes.push(node);
    return node;
}

export function remove(dir : string) {
    const id = rootnodes.findIndex(item => item.path === dir);
    if (id === -1)
        return [];
    const children = rootnodes[id].children;
    rootnodes[id].watcher.close().then(() => {
        rootnodes.splice(id);
    });
    return children;
}

export async function clear() {
    rootnodes = [] as RootDirNode[];
}