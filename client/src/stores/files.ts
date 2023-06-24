import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useFilesStore = defineStore('files', () => {
    const root = ref("");

    return { root };
})