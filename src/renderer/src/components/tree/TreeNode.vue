<script setup lang="ts">
import { type DataNode, useDataNodeStore } from '../../stores/datanode'
import { ref } from 'vue'

const store = useDataNodeStore()

const props = defineProps<{
  node: DataNode
}>()

const showChildren = ref(false)
</script>

<template>
  <div class="node">
    <div class="info">
      <div
        v-if="props.node.subfileCount > 0"
        :class="['arrow', showChildren ? 'show' : 'hide']"
        @click="
          () => {
            showChildren = !showChildren
            if (showChildren && props.node.subfileCount > props.node.subfiles!.length) {
              store.fetchSubfiles(props.node.id, { tree: { show: showChildren }})
            } 
          }
        "
      ></div>
      <div v-else class="block"></div>
      <p>{{ props.node.name }}</p>
    </div>
    <template v-for="n in props.node.children" :key="n.name">
      <TreeNode v-show="showChildren" :node="n" />
    </template>
  </div>
</template>

<style>
div.node {
  display: flex;
  flex-direction: column;
  position: relative;
  left: 2em;
  gap: 5px;
}
div.info {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  height: min-content;
}
p {
  margin-block-start: 0;
  margin-block-end: 0;
}
div.arrow {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
}
div.show {
  border-top: 5px solid #000;
  border-bottom: none;
}
div.hide {
  border-top: none;
  border-bottom: 5px solid #000;
}
div.block {
  width: 0;
  height: 0;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  border-left: 2px solid #000;
  border-right: 2px solid #000;
}
</style>
