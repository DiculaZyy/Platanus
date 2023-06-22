import * as fobj from './fileobjnode';
import * as rootdir from './rootdirnode'

export let root : fobj.FileObjNode | undefined = undefined;

export async function open(dir : string, maxDepth : number = -1) {
    await rootdir.clear();
    await fobj.clear();
    root = await fobj.open(dir);
    return root.id;
}

export const find = fobj.find;

export const get = fobj.get;

