<script setup lang="ts">
import { type DataNode } from '../../stores/datanode'
import { computed, ref, onMounted } from 'vue'

const props = defineProps<{
  node: DataNode
}>()

const emits = defineEmits<{
  (e: 'sizeChange', width: number, height: number): void
}>()

const x = computed(() => props.node.displaySettings.graph.x)
const y = computed(() => props.node.displaySettings.graph.y)
const width = computed(() => props.node.displaySettings.graph.width)
const height = computed(() => props.node.displaySettings.graph.height)

const content = ref<HTMLDivElement | null>(null)
const resizeObserver = new ResizeObserver(() => {
  if (content.value) {
    const w = content.value.clientWidth
    const h = content.value.clientHeight
    emits('sizeChange', w, h)
  }
})

onMounted(() => {
  if (content.value) resizeObserver.observe(content.value)
})
</script>

<template>
  <rect
    :id="props.node.id"
    class="frame"
    :x="x - width / 2"
    :y="y - height / 2"
    :rx="Math.min(height, width) / 7"
    :ry="Math.min(height, width) / 7"
    :width="width"
    :height="height"
  ></rect>
  <foreignObject :x="x - width / 2" :y="y - height / 2" :width="width" :height="height">
    <div ref="content" class="content">
      <h3>{{ props.node.name }}</h3>
    </div>
  </foreignObject>
</template>

<style>
.frame {
  stroke: black;
  fill: none;
}

.content {
  display: inline-block;
  width: fit-content;
  height: fit-content;
  padding: 5px;
}

h3 {
  text-anchor: middle;
  display: inline;
  color: black;
}

text.name {
  text-anchor: middle;
  padding: 0;
  margin: 0;
  font-size: 1rem;
}
</style>
