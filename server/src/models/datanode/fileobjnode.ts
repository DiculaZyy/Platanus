import * as winsc from '../../utils/win-shortcut';
import * as rootnodes from './rootdirnode';
import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';
import { platform } from 'node:process';
import assert from 'node:assert/strict';


export abstract class FileObjNode {
    constructor(name : string, parent : FolderNode | string) {
        this.id = nanoid();
        this.nameInternal = name;
        if (typeof(parent) === 'string')
            this.parent = rootnodes.create(parent);
        else {
            this.parent = parent;
            this.parentCount = 1;
        }
        this.parent.children.push(this);
        // logger.info(`New Node: ${this.parent.name} ---> ${this.path}`);
        console.log(`New Node (${this.id}): ${this.parent.name} ---> ${this.path}`);
    }
    get name() {
        return this.nameInternal;
    }
    set name(name : string) {
        this.nameInternal = name;
        const oldPath : string = this.path;
        const newPath : string = path.join(path.dirname(oldPath), name);
        if (fs.existsSync(newPath)) 
            throw `Rename: Path ${newPath} has alreadly exist!`;
        fs.promises.rename(oldPath, newPath).then(() => {
            // logger.info(`Rename: ${oldPath} --> ${newPath}`)
            console.log(`Rename: ${oldPath} --> ${newPath}`)
        }).catch((err) => {
            // logger.error(err);
            console.error(err);
        });
    }
    abstract get type() : 'file' | 'folder' | 'link' | 'dir';
    get path() : string {
        return path.join(this.parent.path, this.nameInternal);
    }
    abstract get data() : Buffer | string | undefined;
    findParent(name : string) {
        if (name === this.parent.name) 
            return this.parent;
        return this.parentLinks.find(item => item.name === name);
    }
    findChild(name : string) {
        return this.children.find(item => item.name === name);
    }
    walkto(route: string) : FileObjNode | undefined {
        route = path.normalize(route);
        if (route === '.') return this;
        const name = route.split(path.sep, 1)[0];
        const subRoute = route.slice(name.length + path.sep.length);
        return this.findChild(name)?.walkto(subRoute);
    }
    setLocation(pName: string) : void {
        // TODO: Set Location.
    }
    readonly id : string;
    private nameInternal : string;
    parent : FolderNode | rootnodes.RootDirNode;
    parentLinks  = [] as LinkNode[];
    parentCount = 0;
    children = [] as FileObjNode[];
    childCount = 0;
}

export class FileNode extends FileObjNode {
    readonly type = 'file' as 'file';
    get data() {
        return fs.readFileSync(this.path);
    }
}

export class FolderNode extends FileObjNode {
    constructor(name : string, parent : FolderNode | string) {
        super(name, parent);
        (async () => {
            const dir = this.path;
            let rtchildren = [] as string[];
            for (const child of rootnodes.remove(dir)) {
                child.parent= this;
                this.children.push(child);
                rtchildren.push(child.name);
            }
            for await (const d of await fs.promises.opendir(dir)) {
                const entry = path.join(dir, d.name);
                if (!rtchildren.includes(entry)) {
                    create(d, d.name, this);
                }
            }
            this.childCount = this.children.length;
        })();
    }
    readonly type = 'folder' as 'folder';
    readonly data = undefined;
}

export abstract class LinkNode extends FileObjNode {
    constructor(name : string, parent : FolderNode | string) {
        super(name, parent);
        this.targetInternal = new UnknownDirNode('Processing', this);
    }
    readonly type = 'link' as 'link';
    get data() : Buffer | string | undefined {
        if (this.targetInternal instanceof FileObjNode)
            return this.targetInternal.data;
        return undefined;
    }
    get target() {
        return this.targetInternal;
    }
    set target(target : FileObjNode | UnknownDirNode | string) {
        if (typeof target === 'string') {
            (async () => {
                let node = find(target);
                if (!(node instanceof FileObjNode)){
                    if (!fs.existsSync(target))
                        return ;
                    const name = path.basename(target);
                    const dir = path.dirname(target);
                    const stat = await fs.promises.stat(target);
                    node = create(stat, name, dir);
                    assert(node instanceof FileObjNode);
                }
                node.parentLinks.push(this);
                console.log(`New Link: ${this.id} ---> ${node.id}`)
                this.targetInternal = node;
                this.children.pop();
                this.children.push(this.targetInternal);
            })() ;
        }
        else {
            this.targetInternal = target;
            if (this.targetInternal instanceof FileObjNode) {
                this.children.pop();
                this.children.push(this.targetInternal);
            }
        }
    }
    targetInternal : FileObjNode | UnknownDirNode;
}

export class SymbolicLinkNode extends LinkNode {
    constructor(name : string, parent : FolderNode | string) {
        super(name, parent);
        fs.promises.readlink(this.path).then(target => {
            this.target = target;
        });
    }
}

export class ShortcutNode extends LinkNode {
    constructor(name : string, parent : FolderNode | string) {
        super(name, parent);
        winsc.read(this.path).then(target => {
            this.target = target.TargetPath;
        });
    }
}

export class UnknownDirNode {
    constructor(dir : string, parent : LinkNode) {
        this.path = dir;
        this.parent= parent;
    }
    get name() {
        return path.basename(this.path);
    }
    readonly type = 'dir' as 'dir';
    readonly path : string;
    parent: LinkNode;
}


let fileObjMap = new Map<string, FileObjNode>();

export function create(d: fs.Dirent | fs.Stats, name : string,
        parent : FolderNode | string) {
    let node : FileObjNode;
    if (d.isDirectory()) {
        node = new FolderNode(name, parent);
    }
    else if (d.isFile()) {
        if (platform === 'win32' && name.endsWith('.lnk')) {
            node = new ShortcutNode(name, parent);
        }
        else {
            node = new FileNode(name, parent);
        }
    }
    else if (d.isSymbolicLink()) {
        node = new SymbolicLinkNode(name, parent);
    }
    else {
        throw `Creating FileObjNode: Can't process ${name}!`;
    }
    fileObjMap.set(node.id, node);
    return node;
}

export function get(id : string) {
    return fileObjMap.get(id);
}

export function find(dir : string) {
    const root = rootnodes.match(dir);
    return root?.walkto(path.relative(root.path, dir));
}

export async function open(dir : string) {
    dir = path.normalize(dir);
    const name = path.basename(dir);
    const root = path.dirname(dir);
    const stat = await fs.promises.stat(dir);
    return create(stat, name, root);
}

export async function clear() {
    fileObjMap.clear();
}