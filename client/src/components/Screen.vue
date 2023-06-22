<script setup>
import { ref, onMounted } from 'vue';
import svgPanZoom from 'svg-pan-zoom'

onMounted(() => {
    const zoom = svgPanZoom('.screen', {
        dblClickZoomEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.1,
        maxZoom: 5
    });
})

import Node from './Node.vue'
import Edge from './Edge.vue'
import Controller from './Controller.vue';
import AsyncLock from 'async-lock';
import { layout, config } from '../utils/drawtree';
const nodes = ref([]);
const edges = ref([]);
const controllers = ref([]);
const show = (v) => {
    nodes.value = [];
    edges.value = [];
    controllers.value = [];
    const walk = (v) => {
        nodes.value.push(v);
        if (v.hasChildren) {
            edges.value.push({
                class : "from",
                id : v.id,
                v : { x : v.x + v.width / 2, y : v.y },
                w : { x : v.x - v.width / 2 + v.maxwidth 
                        + config.minMargin.child, y : v.y }
            });
            controllers.value.push({
                node : v,
                showChildren : v.showChildren || false,
                x : v.x - v.width / 2 + v.maxwidth
                    + config.minMargin.child,
                y : v.y,
            });
            v.children.forEach((w) => {
                if (w.show) {
                    edges.value.push({
                        class : "to",
                        id : w.id,
                        v : { x : v.x - v.width / 2 + v.maxwidth 
                                + config.minMargin.child, y : v.y },
                        w : { x : w.x - w.width / 2, y : w.y }
                    })
                    walk(w);
                }
            });
        }
    };
    console.log(v);
    walk(v);
}
let lock = new AsyncLock();
const update = () => {
    lock.acquire('update', () => {
        tree = layout(tree);
        show(tree);
    })
}

import service from '../utils/request';
let tree = {};
service.get("datanode/root").then((res) => {
    tree.name = res.data.name;
    tree.id = res.data.id;
    tree.show = true;
    tree.hasChildren = res.data.hasChildren;
    update();
});
const getChildren = async (id) => {
    const res = await service.get(`datanode/${id}/children`);
    let children = [];
    res.data.forEach((child) => {
        children.push({
            id : child.id,
            name : child.name,
            hasChildren : child.hasChildren,
        })
    });
    return children;
} 

</script>

<template>
    <svg class="screen" width="90%" height="100%" xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 1000 1000" version="1.1">
        <Node v-for="v in nodes" :key="v.id" :node="v" 
            @sizeChange="(width, height) => {
                v.width = width;
                v.height = height;
                update();
            }"
        />
        <Edge v-for="e in edges" :key="e.id" :class="e.class" :id="e.id" :v="e.v" :w="e.w" />
        <Controller v-for="c in controllers" :key="c.node.id" :id="c.node.id"
            :x="c.x" :y="c.y" r="5" :show="c.showChildren"
            @show="async () => {
                if (c.node.children.length === 0)
                    c.node.children = await getChildren(c.node.id);
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
