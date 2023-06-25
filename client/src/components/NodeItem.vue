<script setup lang="ts">
import { ref, onMounted } from 'vue';

import { type Node, type Area } from '@/types/items';

const props = defineProps<{
    node : Node;
}>();

const emits = defineEmits<{
    ( e : 'sizeChange', width : number, height : number ) : void;
}>();

const nameArea = ref<Area>({ width : 0, height : 0 });

const nameRef = ref<SVGTextElement | null>(null);
onMounted(() => {
    if (nameRef.value instanceof SVGTextElement) {
        nameArea.value = nameRef.value.getBBox();
        const width = Math.max(props.node.width, nameArea.value.width * 1.2);
        const height = Math.max(props.node.height, nameArea.value.height * 1.2);
        if (width > props.node.width || height > props.node.height) {
            emits('sizeChange', width, height);
        }
    }
});

</script>

<template>
    <g class="node">
        <rect class="frame" 
            :id="node.id"
            :x="props.node.x - props.node.width / 2" 
            :y="props.node.y - props.node.height / 2" 
            :rx="Math.min(props.node.height, props.node.width) / 7" 
            :ry="Math.min(props.node.height, props.node.width) / 7" 
            :width="props.node.width" 
            :height="props.node.height"
        ></rect>
        <text class="name" ref="nameRef"
            :x="props.node.x" 
            :y="props.node.y + nameArea.height / 4" 
        >{{ props.node.name }}</text>
    </g>
</template>


<style>
.frame {
    stroke : black;
    fill : none;
}

text.name {
    text-anchor: middle;
    padding : 0;
    margin : 0;
    font-size: 1rem;
}
</style>