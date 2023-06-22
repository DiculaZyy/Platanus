<script setup>
import { ref } from 'vue';
const props = defineProps(['x', 'y', 'r', 'show']);
const _show = ref(props.show);
const emits = defineEmits(['show', 'hide'])


</script>

<template>
    <g class="controller" @click="() => {
        _show ? $emit('hide') : $emit('show');
        _show = !_show;
    }">
        <circle :cx="props.x" :cy="props.y" :r="props.r"></circle>
        <line 
            :x1="props.x - props.r / 2" 
            :y1="props.y" 
            :x2="props.x + props.r / 2" 
            :y2="props.y"
        ></line> 
        <line 
            :x1="props.x"
            :y1="props.y - props.r / 2"
            :x2="props.x"
            :y2="props.y + props.r / 2"
            v-show="_show"
        ></line> 
    </g>
</template>

<style>
circle {
    fill : white;
    stroke : black;
}
line {
    stroke : black;
}
</style>