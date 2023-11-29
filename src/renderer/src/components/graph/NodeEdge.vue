<script setup lang="ts">
import { type DataNode } from '../../stores/datanode'
import { computed } from 'vue'

const roundCorner = (v: number, w: number, r: number): number => {
  return w + (v > w ? 1 : -1) * Math.min(Math.abs(v - w) / 2, r)
}

const props = defineProps<{
  parent: DataNode
  child: DataNode
  r: number
}>()
const parent = computed(() => props.parent.displaySettings.graph.anchor.child)
const tail = computed(() => props.parent.displaySettings.graph.anchor.tail)
const head = computed(() => props.child.displaySettings.graph.anchor.head)
const child = computed(() => props.child.displaySettings.graph.anchor.parent)
</script>

<template>
  <path
    :d="`M ${parent.x} ${parent.y} 
         L ${roundCorner(parent.x, tail.x, r)} ${roundCorner(parent.y, tail.y, r)}
         Q ${tail.x} ${tail.y}
           ${roundCorner(head.x, tail.x, r)} ${roundCorner(head.y, tail.y, r)} 
         L ${roundCorner(tail.x, head.x, r)} ${roundCorner(tail.y, head.y, r)} 
         Q ${head.x} ${head.y}
           ${roundCorner(child.x, head.x, r)} ${roundCorner(child.y, head.y, r)} 
         L ${child.x} ${child.y}
         `"
  ></path>
</template>

<style>
path {
  fill: none;
  stroke: black;
  stroke-linecap: round;
}
.link {
  stroke-dasharray: 3 2;
}
</style>
