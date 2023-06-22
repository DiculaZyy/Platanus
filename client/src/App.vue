<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue';
import service from './utils/request'
const rootDir = ref("")
const show = ref(false)
const open = async () => {
  await service.post('open', {
    dir : rootDir.value,
    maxDepth : -1
  })
}
</script>

<template>
  <header>
    <div class="input">
      <input v-model="rootDir" placeholder="输入根目录"/>
      <button @click="async () => { 
          show = false; 
          await open();
          show = true;
        }"
      >确定</button>
    </div>
    <div class="router">
      <nav>
        <RouterLink to="/datanode">DataNode</RouterLink>
      </nav>
    </div>
  </header>
  <RouterView v-if="show"/>
</template>

<style>
div#app {
  min-height: 90vh;
  display : flex;
  flex-direction: column;
  text-align : center;
  align-items: center;
}

header {
  width : 100%;
}

div.input {
  margin: auto;
  padding-bottom: 10px;
  width : 60%;
  display : flex;
  flex-direction: row;
}

input {
  flex : auto;
}

button {
  flex-shrink : 3rem;
}

div.router {
  text-align : center;
}

nav {
  display : inline-block;
}
</style>
