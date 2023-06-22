<script setup>
import { computed } from 'vue';
const props = defineProps(['v', 'w', 'type'])
const cpx1 = computed(() => {
    return (2 *props.v.x + props.w.x) / 3
})
const cpx2 = computed(() => {
    return (props.v.x + 2 * props.w.x) / 3
})
</script>

<template>
    <path :d="'M' + props.v.x + ' ' + props.v.y + ' ' +
              'C' + cpx1 + ' ' + props.v.y + ' ' +
                    cpx2 + ' ' + props.w.y + ' ' +
                    props.w.x + ' ' + props.w.y" 
    ></path>
</template>

<style>
path {
    fill : none;
    stroke : black
}
.link {
    stroke-dasharray : 3 2
}
</style>