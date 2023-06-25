<script setup lang="ts">
import { useFilesStore } from '@/stores/files';
import { useDataNodeStore } from '@/stores/datanode';
import { open } from '@/api/files';

const files = useFilesStore();
const datanode = useDataNodeStore();

</script>

<template>
    <h1>Platanus</h1>
    <div class="input">
        <input v-model="files.root" placeholder="输入根目录"/>
        <button @click="async () => { 
          await open(files.root);
          await datanode.resetRoot();
        }">确定</button>
    </div>
</template>

<style>
h1 {
    text-align: center;
}

div.input {
    width : 50vw;
    text-align: center;
    display : flex;
    flex-direction: row;
}

input {
  flex : auto;
}

button {
  flex-shrink : 3rem;
}
</style>