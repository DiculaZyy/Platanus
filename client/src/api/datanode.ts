import service from '@/utils/request';

export interface DataNode  { 
    id : string;
    name : string;
    type : string;
    parentCount : number;
    childCount : number;
    parents? : Array<DataNode>;
    children? : Array<DataNode>;
}


export const getRoot = async () => {
    return service.get<DataNode>("datanode/root").then((res) => {
        return res.data;
    })
}

export const getDataNode = async (id : string) => {
    return service.get<DataNode>(`datanode/${id}`).then((res) => {
        return res.data;
    })
}

export const getParents = async (id : string) => {
    return service.get<Array<DataNode>>(`datanode/${id}/parents`).then((res) => {
        return res.data;
    })
}

export const getChildren = async (id : string) => {
    return service.get<Array<DataNode>>(`datanode/${id}/children`).then((res) => {
        return res.data;
    })
}