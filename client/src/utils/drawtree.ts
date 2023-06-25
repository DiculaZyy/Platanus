export const config = {
    horizontal : true,
    defaultSize : {
        width : 100,
        height : 40,
    },
    minMargin : {
        parent : 60,
        child : 30,
        sibling : 20,
    }
}


export interface Tree {
    id : string;
    name : string;
    show : boolean;
    x : number;
    y : number;
    height : number;
    width : number;
    maxWidth : number;
    children : Array<Tree>
    childCount : number;
    showChildren : boolean;
}


class _Tree implements Tree {
    constructor(tree : DrawTree) {
        this.id = tree.id;
        this.name = tree.name;
        this.show = tree.show;
        this.x = tree.x;
        this.y = tree.y;
        this.height = tree.height;
        this.width = tree.width;
        this.maxWidth = tree.maxWidth;
        this.childCount = tree.childCount;
        this.children = (tree.children ? tree.children.map((value) => {
            return new _Tree(value);
        }) : []);
        if (tree.unshownChildren) {
            this.children.concat(tree.unshownChildren);
        }
        this.showChildren = tree.showChildren;
    }
    id : string;
    name : string;
    show : boolean;
    x : number;
    y : number;
    height : number;
    width : number;
    maxWidth : number;
    childCount : number;
    children : Array<Tree>;
    showChildren : boolean;
}

class DrawTree implements Tree {
    constructor(tree : Tree, parent : DrawTree | null = null,
                depth = 0, number = 0) {
        this.id = tree.id;
        this.name = tree.name;
        this.show = tree.show || false;
        this.childCount = tree.childCount;
        this.children = tree.children !== undefined 
            ? tree.children.filter(value => value.show).map((value, index) => {
                return new DrawTree(value, this, depth + 1, index);
            }) : [] as Array<DrawTree>;
        this.showChildren = this.children.length > 0;
        this.unshownChildren = tree.children 
            ? tree.children.filter(value => !value.show) 
            : [];
        this.width = tree.width || config.defaultSize.width;
        this.height = tree.height || config.defaultSize.height;
        this.maxWidth = this.width;
        this.parent = parent;
        this.depth = depth;
        this.number = number;
        this.x = 0;
        this.y = 0;
        this.offset = 0;
        this.change = 0;
        this.shift = 0;
        this.ancestor = this;
        this.thread = null;
        this._leftMostSibling = null;
        this._leftSibling = null;
    }

    get right() : DrawTree | null {
        return (this.thread || (
            this.children.length > 0
            ? this.children[this.children.length - 1]
            : null)
        );
    }

    get left() : DrawTree | null {
        return (this.thread || (
            this.children.length > 0
            ? this.children[0]
            : null)
        );
    }

    get leftSibling() {
        if (this.leftMostSibling && this.parent)
            this._leftSibling = this.parent.children[this.number - 1];
        return this._leftSibling;
    }

    get leftMostSibling() {
        if (!this._leftMostSibling && 
            this.parent &&
            this != this.parent.children[0]
        ){
            this._leftMostSibling = this.parent.children[0];
        }
        return this._leftMostSibling;
    }

    id : string;
    name : string;
    show : boolean;
    x : number;
    y : number;
    height : number;
    width : number;
    maxWidth : number;
    childCount : number;
    children : Array<DrawTree>;
    unshownChildren : Array<Tree>;
    showChildren : boolean;
    parent : DrawTree | null;
    depth : number;
    number : number;
    offset : number;
    change : number;
    shift : number;
    ancestor : DrawTree;
    thread : DrawTree | null;
    _leftMostSibling : DrawTree | null;
    _leftSibling : DrawTree | null;
}

const firstWalk = (v : DrawTree) => {
    if (v.children.length === 0) {
        if (v.leftMostSibling && v.leftSibling) {
            v.y = v.leftSibling.y 
                + v.leftSibling.height / 2
                + v.height / 2
                + config.minMargin.sibling;
        }
        else {
            v.y = 0;
        }
    }
    else {
        let defaultAncestor = v.children[0];
        v.children.forEach((w) => {
            firstWalk(w);
            defaultAncestor = apportion(w, defaultAncestor);
        })
        executeShifts(v);
        const ell = v.children[0];
        const arr = v.children[v.children.length - 1];
        const midpoint = (ell.y - ell.height / 2 + arr.y + arr.height / 2) / 2;
        const w = v.leftSibling;
        if (w) {
            v.y = w.y + w.height / 2 + v.height / 2 + config.minMargin.sibling;
            v.offset = v.y - midpoint;
        }
        else {
            v.y = midpoint;
        }
    }
    return v;
}

const apportion = (v : DrawTree, defaultAncestor : DrawTree) => {
    const w = v.leftSibling;
    if (w && v.leftMostSibling) {
        let vOuterRight = v;
        let vInnerRight = v;
        let vInnerLeft = w;
        let vOuterLeft = v.leftMostSibling;

        let sOuterRight = v.offset;
        let sInnerRight = v.offset;
        let sInnerLeft = vInnerLeft.offset;
        let sOuterLeft = vOuterLeft?.offset || 0;

        while (vInnerLeft.right && vInnerRight.left
            && vOuterLeft.left && vOuterRight.right) {
            vInnerLeft = vInnerLeft.right;
            vInnerRight = vInnerRight.left;
            vOuterLeft = vOuterLeft.left;
            vOuterRight = vOuterRight.right;

            if (vOuterRight)
                vOuterRight.ancestor = v;

            const shift = (vInnerLeft.y + vInnerLeft.height / 2 + sInnerLeft)
                        - (vInnerRight.y - vInnerRight.height / 2 + sInnerRight)
                        + config.minMargin.sibling;
            if (shift > 0) {
                const a = ancestor(vInnerLeft, v, defaultAncestor);
                moveSubtree(a, v, shift);
                sInnerRight += shift;
                sOuterRight += shift;
            }
            sOuterLeft += vOuterLeft.offset;
            sInnerLeft += vInnerLeft.offset;
            sInnerRight += vInnerRight.offset;
            sOuterRight += vOuterRight.offset;
        }
        if (vInnerLeft.right && !vOuterRight?.right) {
            vOuterRight.thread = vInnerLeft.right;
            vOuterRight.offset += sInnerLeft - sOuterRight;
        }
        else if (vInnerRight.left && !vOuterLeft.left) {
            vOuterLeft.thread = vInnerRight.left;
            vOuterLeft.offset += sInnerRight - sOuterLeft;
            defaultAncestor = v;
        }
    }
    return defaultAncestor;
}

const ancestor = (w : DrawTree, v : DrawTree, 
        defaultAncestor : DrawTree) => {
    if (v.parent && v.parent.children.includes(w.ancestor)) {
        return w.ancestor;
    }
    else {
        return defaultAncestor;
    }
}

const moveSubtree = (wLeft : DrawTree, wRight : DrawTree, shift : number) => {
    const cnt = wRight.number - wLeft.number;
    wRight.change -= shift / cnt;
    wRight.shift += shift;
    wLeft.change += shift / cnt;
    wRight.y += shift;
    wRight.offset += shift;
}

const executeShifts = (v : DrawTree) => {
    let shift = 0;
    let change = 0;
    v.children.concat().reverse().forEach((w) => {
        w.y += shift;
        w.offset += shift;
        change += w.change;
        shift += w.shift + change;
    })
}

const secondWalk= (v : DrawTree, maxWidths : Map<number, number>, 
                mod = 0, depth = 0, min : number | null = null) => {
    v.y += mod;
    const maxWidth = maxWidths.get(depth)
    if (maxWidth) {
        maxWidths.set(depth, Math.max(maxWidth, v.width));
    }
    else
        maxWidths.set(depth, v.width);
    const y = v.y - v.height / 2 - config.minMargin.sibling;
    if (min === null || y < min) {
        min = y;
    }
    v.children.forEach((w) => {
        min = secondWalk(w, maxWidths, mod + v.offset, depth + 1, min);
    })
    return min;
}

const thirdWalk = (tree : DrawTree, maxWidths : Map<number, number>,
                    n : number, depth = 0) => {
    tree.y += n;
    const maxWidth = maxWidths.get(depth)
    if (maxWidth)
        tree.maxWidth = maxWidth;
    tree.x += tree.width / 2 + config.minMargin.parent;
    tree.children.forEach((c) => {
        c.x += tree.x - tree.width / 2 + tree.maxWidth + config.minMargin.child;
        thirdWalk(c, maxWidths, n, depth + 1);
    })
}

const buchheim = (tree : DrawTree) => {
    const dt = firstWalk(tree);
    const maxwidths = new Map();
    const min = secondWalk(dt, maxwidths);
    thirdWalk(dt, maxwidths, min < 0 ? -min : 0);
    return dt;
}

export const layout = (tree : Tree) => {
    const drawtree = new DrawTree(tree);
    buchheim(drawtree);
    return new _Tree(drawtree);
}

import { type DataNode } from "@/api/datanode";

export const init = (tree : DataNode) : Tree => {
    return {
        id : tree.id,
        name : tree.name,
        show : false,
        x : 0,
        y : 0,
        height : 0,
        width : 0,
        maxWidth : 0,
        children : [] as Array<Tree>,
        childCount : tree.childCount,
        showChildren : false,
    }
}