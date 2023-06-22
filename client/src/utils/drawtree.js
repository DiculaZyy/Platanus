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

class Tree {
    constructor(tree) {
        this.id = tree.id;
        this.name = tree.name;
        this.show = tree.show;
        this.x = tree.x;
        this.y = tree.y;
        this.height = tree.height;
        this.width = tree.width;
        this.maxwidth = tree.maxwidth;
        this.hasChildren = tree.hasChildren;
        this.children = (tree.children ? tree.children.map((value) => {
            return new Tree(value);
        }) : []).concat(tree.unshownChildren ? tree.unshownChildren : []);
        this.showChildren = tree.showChildren;
    }
}

class DrawTree {
    constructor(tree, parent = null, depth = 0, number = 0) {
        this.id = tree.id;
        this.name = tree.name;
        this.show = tree.show || false;
        this.hasChildren = tree.hasChildren ||
                           tree.children && tree.children.length > 0;
        this.children = tree.children ? tree.children.map((value, index) => {
            return value.show && new DrawTree(value, this, depth + 1, index);
        }).filter(value => value) : [];
        this.unshownChildren = tree.children 
            ? tree.children.filter(value => !value.show) 
            : [];
        this.showChildren = this.children.length > 0;
        this.width = tree.width || config.defaultSize.width;
        this.height = tree.height || config.defaultSize.height;
        this.maxwidth = this.width;
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

    get right() {
        return (this.thread || (
            this.children.length > 0
            ? this.children[this.children.length - 1]
            : null)
        );
    }

    get left() {
        return (this.thread || (
            this.children.length > 0
            ? this.children[0]
            : null)
        );
    }

    get leftSibling() {
        if (this.leftMostSibling)
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
}

const firstWalk = (v) => {
    if (v.children.length === 0) {
        if (v.leftMostSibling) {
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

const apportion = (v, defaultAncestor) => {
    const w = v.leftSibling;
    if (w) {
        let vOuterRight = v;
        let vInnerRight = v;
        let vInnerLeft = w;
        let vOuterLeft = v.leftMostSibling;

        let sOuterRight = v.offset;
        let sInnerRight = v.offset;
        let sInnerLeft = vInnerLeft.offset;
        let sOuterLeft = vOuterLeft.offset;

        while (vInnerLeft.right && vInnerRight.left) {
            vInnerLeft = vInnerLeft.right;
            vInnerRight = vInnerRight.left;
            vOuterLeft = vOuterLeft.left;
            vOuterRight = vOuterRight.right;

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
        if (vInnerLeft.right && !vOuterRight.right) {
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

const ancestor = (w, v, defaultAncestor) => {
    if (v.parent.children.includes(w.ancestor)) {
        return w.ancestor;
    }
    else {
        return defaultAncestor;
    }
}

const moveSubtree = (wLeft, wRight, shift) => {
    const cnt = wRight.number - wLeft.number;
    wRight.change -= shift / cnt;
    wRight.shift += shift;
    wLeft.change += shift / cnt;
    wRight.y += shift;
    wRight.offset += shift;
}

const executeShifts = (v) => {
    let shift = 0;
    let change = 0;
    v.children.toReversed().forEach((w) => {
        w.y += shift;
        w.offset += shift;
        change += w.change;
        shift += w.shift + change;
    })
}

const secondWalk= (v, maxwidths, mod = 0, depth = 0, min = null) => {
    v.y += mod;
    if (maxwidths.has(depth)) {
        maxwidths.set(depth, Math.max(maxwidths.get(depth), v.width));
    }
    else
        maxwidths.set(depth, v.width);
    const y = v.y - v.height / 2 - config.minMargin.sibling;
    if (min === null || y < min) {
        min = y;
    }
    v.children.forEach((w) => {
        min = secondWalk(w, maxwidths, mod + v.offset, depth + 1, min);
    })
    return min;
}

const thirdWalk = (tree, maxwidths, n, depth = 0) => {
    tree.y += n;
    tree.maxwidth = maxwidths.get(depth)
    tree.x += tree.width / 2 + config.minMargin.parent;
    tree.children.forEach((c) => {
        c.x += tree.x - tree.width / 2 + tree.maxwidth + config.minMargin.child;
        thirdWalk(c, maxwidths, n, depth + 1);
    })
}

const buchheim = (tree) => {
    const dt = firstWalk(tree);
    let maxwidths = new Map();
    const min = secondWalk(dt, maxwidths);
    thirdWalk(dt, maxwidths, min < 0 ? -min : 0);
    return dt;
}

export const layout = (tree) => {
    let drawtree = new DrawTree(tree);
    buchheim(drawtree);
    return new Tree(drawtree);
}