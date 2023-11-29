<script setup lang="ts">
import { useDataNodeStore } from '../../stores/datanode'

import TreeNode from './TreeNode.vue'

const store = useDataNodeStore()
</script>

<template>
  <div class="nodetree">
    <div v-for="r in store.rootdirs.toArray()" :key="r.dir" class="root">
      <div class="dir">{{ r.dir }}</div>
      <template v-for="n in r.nodes" :key="n.name">
        <TreeNode v-show="n.displaySettings.tree.show" :node="n" />
      </template>
    </div>
  </div>
</template>

<style>
div.nodetree {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 85%;
}
div.dir {
  text-align: left;
}
</style>
