import service from '@/utils/request';

export const open = async (dir : string, maxDepth = -1) => {
    return service.post("open", {
        dir : dir,
        maxDepth : maxDepth
    });
}