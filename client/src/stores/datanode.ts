import { defineStore } from 'pinia';
import * as api from '@/api/datanode';
import { type DataNode } from '@/api/datanode';


export const useDataNodeStore = defineStore('datanode', {
    state : () => ({
        rootnode : null as DataNode | null,
        datanodes : new Map<string, DataNode>()
    }),
    getters : { 
        get(state) {
            return async (id : string) : Promise<DataNode | undefined> => {
                let node = state.datanodes.get(id);
                if (node === undefined) {
                    node = await api.getDataNode(id);
                    if (node)
                        state.datanodes.set(id, node);
                } 
                return node;
            }
        },
        getChildren() {
            return async (id : string) : Promise<Array<DataNode> | undefined> => {
                const node = await this.get(id);
                if (node !== undefined) {
                    if (node.children === undefined ||
                        node.children.length !== node.childCount) {
                        node.children = await api.getChildren(node.id);
                    }
                    return node.children;
                }
                return undefined;
            }
        },
        getParents() {
            return async (id : string) : Promise<Array<DataNode> | undefined> => {
                const node = await this.get(id);
                if (node !== undefined) {
                    if (node.parents === undefined ||
                        node.parents.length !== node.parentCount) {
                        node.parents = await api.getParents(node.id);
                    }
                    return node.parents;
                }
                return undefined;
            }
        }
    },
    actions : {
        async resetRoot() {
            this.datanodes.clear();
            this.rootnode = await api.getRoot();
        }
    }
})
