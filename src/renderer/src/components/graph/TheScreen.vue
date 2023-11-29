<script setup lang="ts">
import { useDataNodeStore, DataNode } from '../../stores/datanode'

import { onMounted, ref, watch } from 'vue'

import TheNode from './TheNode.vue'
import NodeEdge from './NodeEdge.vue'

import { layout } from '../../layouts'

import svgPanZoom from 'svg-pan-zoom'

const zoom = ref<ReturnType<typeof svgPanZoom> | null>(null)
onMounted(() => {
  zoom.value = svgPanZoom('.screen', {
    dblClickZoomEnabled: false,
    fit: true,
    center: true,
    minZoom: 0.1,
    maxZoom: 5
  })
  update()
  resetPanZoom()
})

const resetPanZoom = (): void => {
  if (zoom.value != null) {
    zoom.value.reset()
    const size = zoom.value.getSizes()
    zoom.value.pan({
      x: size.width / 2,
      y: size.height / 2
    })
  }
}

const directions = ['RIGHT', 'DOWN', 'LEFT', 'UP'] as const
const direction = ref(0)

const store = useDataNodeStore()

const root = ref<DataNode | null>(null)

const update = (): void => {
  console.log('layout')
  if (root.value) {
    layout(root.value, { direction: directions[direction.value] })
  }
}

// store.$subscribe(update, { immediate: true })
store.$onAction(({ name, after }) => {
  if (name == 'fetchSubfiles') after(update)
})

watch(direction, update)

watch(root, () => {
  console.log(root.value)
  store.datanodes.list.forEach((v) => {
    v.displaySettings.graph.show = false
  })
  const show = (v: DataNode): void => {
    v.displaySettings.graph.show = true
    v.children.forEach((w) => show(w))
  }
  if (root.value) {
    show(root.value)
    update()
  }
})
</script>

<template>
  <div class="controller">
    <select v-model="root">
      <optgroup v-for="r in store.rootdirs.toArray()" :key="r.dir" :label="r.dir">
        <option v-for="n in r.nodes" :key="n.id" :value="n">{{ n.name }}</option>
      </optgroup>
    </select>
    <button class="graph" @click="resetPanZoom()">Reset</button>
    <button
      class="graph"
      @click="
        () => {
          direction = (direction + 1) % 4
        }
      "
    >
      {{ directions[direction] }}
    </button>
  </div>
  <svg
    class="screen"
    width="85vw"
    height="80vh"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1000 1000"
    version="1.1"
  >
    <template v-for="n in store.datanodes.list.values()" :key="n.id">
      <template v-if="n.displaySettings.graph.show">
        <TheNode
          :node="n"
          @size-change="
            (width, height) => {
              n.displaySettings.graph.width = width
              n.displaySettings.graph.height = height
              update()
            }
          "
        ></TheNode>
        <NodeEdge
          v-if="typeof n.parentDir != 'string'"
          :parent="n.parentDir"
          :child="n"
          :r="8"
        ></NodeEdge>
      </template>
    </template>
  </svg>
</template>

<style>
controller {
  width: 50vh;
  flex: 1;
  display: flex;
  flex-direction: row;
}

button .graph {
  display: flex;
  flex: 1;
}

.screen {
  flex: 1;
  border: solid;
  display: inline-block;
}
</style>
