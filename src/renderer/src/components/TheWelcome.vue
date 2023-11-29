<script setup lang="ts">
import { ref } from 'vue'

import Versions from './Versions.vue'

import { useDataNodeStore } from '../stores/datanode'

const store = useDataNodeStore()

const dir = ref('')
</script>

<template>
  <h1>Platanus</h1>
  <h2>Dirs</h2>
  <div class="input">
    <input v-model="dir" placeholder="Input directory" />
    <button @click="() => store.open(dir)">Ok</button>
  </div>
  <button @click="() => store.clear()">Clear</button>
  <h2>Versions</h2>
  <Versions />
</template>

<style>
h1 {
  text-align: center;
}

div.input {
  width: 80vw;
  display: block;
  flex-direction: row;
}

input {
  width: 60vw;
}

button {
  flex-shrink: 3rem;
}

ul {
  display: flex;
}

ul li {
  flex: 1;
}
</style>
