import * as fobj from './fileobjnode';

export let root : fobj.FileObjNode;

export async function open(dir : string) {
    root = await fobj.open(dir);
}

export const find = fobj.find;

export const get = fobj.get;

