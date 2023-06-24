<script setup lang="ts">
import { ref, onMounted } from 'vue';
import svgPanZoom from 'svg-pan-zoom'

onMounted(() => {
    svgPanZoom('.screen', {
        dblClickZoomEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 5
    });
})

import { layout, config, init, type Tree } from '../utils/drawtree';
let tree : Tree = init({});

import { type Node, type Point } from '@/types/items';
import NodeItem from './NodeItem.vue';
import EdgeItem from './EdgeItem.vue';
import ControllerItem from './ControllerItem.vue';
const nodes = ref<Array<Node>>([]);
const edges = ref<Array<{ 
    v : Point;
    w : Point;
    id : string;
    type : string;
    class : 'from' | 'to';
}>>([]);
const controllers = ref<Array<{
    node : Tree;
    x : number;
    y : number;
    r : number;
    showChildren : boolean;
}>>([]);


const show = (v : Tree) => {
    nodes.value = [];
    edges.value = [];
    controllers.value = [];
    const walk = (v : Tree) => {
        nodes.value.push(v);
        if (v.hasChildren) {
            edges.value.push({
                id : v.id,
                class : "from",
                type : "subdir",
                v : { x : v.x + v.width / 2, y : v.y },
                w : { x : v.x - v.width / 2 + v.maxWidth 
                        + config.minMargin.child, y : v.y }
            });
            controllers.value.push({
                node : v,
                showChildren : v.showChildren || false,
                x : v.x - v.width / 2 + v.maxWidth
                    + config.minMargin.child,
                y : v.y,
                r : 5
            });
            v.children.forEach((w) => {
                if (w.show) {
                    edges.value.push({
                        class : "to",
                        id : w.id,
                        type : "subdir",
                        v : { x : v.x - v.width / 2 + v.maxWidth 
                                + config.minMargin.child, y : v.y },
                        w : { x : w.x - w.width / 2, y : w.y }
                    })
                    walk(w);
                }
            });
        }
    };
    walk(v);
}

import AsyncLock from 'async-lock';
let lock = new AsyncLock();
const update = () => {
    lock.acquire('update', () => {
        tree = layout(tree);
        show(tree);
    })
}

import * as datanode from '@/api/datanode';
datanode.getRoot().then((res) => {
    tree.name = res.name;
    tree.id = res.id;
    tree.show = true;
    tree.hasChildren = res.hasChildren;
    update();
})



</script>

<template>
    <svg class="screen" width="85vw" height="85vh" xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1000 1000" version="1.1">
        <NodeItem v-for="v in nodes" :key="v.id" :node="v"
            @sizeChange="(width, height) => {
                v.width = width;
                v.height = height;
                update();
            }"
         />
        <EdgeItem v-for="(e, i) in edges" :key="i"
            :v="e.v" :w="e.w" :type="e.type"/>
        <ControllerItem v-for="c in controllers" :key="c.node.id"
            :x="c.x" :y="c.y" :r="c.r" :show="c.showChildren" 
            @show="async () => {
                if (c.node.children.length === 0) {
                    c.node.children = (await datanode.getChildren(c.node.id))
                                    .map(child => init(child));
                }
                c.node.children.forEach(child => child.show = true);
                update();
            }"
            @hide="() => {
                c.node.children.forEach(child => child.show = false);
                update();
            }"
        />
    </svg>
</template>

<style>
.screen {
    flex : 1;
    border : solid;
    display : inline-block;
}
</style>