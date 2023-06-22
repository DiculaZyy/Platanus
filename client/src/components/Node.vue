<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps(['node']);

const emits = defineEmits({
    sizeChange(width, height) {
        return width > 0 && height > 0;
    }
});

const nameArea = ref({ width : 0, height : 0 });
const nameRef = ref();
onMounted(() => {
    nameArea.value = nameRef.value.getBBox();
    console.log(props.node.name);
    const width= Math.max(props.node.width, nameArea.value.width * 1.2);
    const height = Math.max(props.node.height, nameArea.value.height * 1.2);
    console.log(props.node.name, width, height);
    if (width > props.node.width || height > props.node.height) {
        console.log(props.node.name, "emit");
        emits('sizeChange', width, height);
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