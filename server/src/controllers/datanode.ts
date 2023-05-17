import * as datanode from '../models/datanode';
import { ParamsSchema, ParamsSchema as iParamsSchema } from '../types/datanode/paramsschema';
import {
    FastifyRequest,
    FastifyReply
} from 'fastify';

function getNode(id : string | undefined) {
    if (id) {
        const node = datanode.get(id);
        if (!node)
            throw `Unknown id: ${id}`;
        return node;
    }
    throw `Unknown id: ${id}`;
}


export async function getRoot(
    request : FastifyRequest<{Params: ParamsSchema}>,
    reply : FastifyReply) {
    reply.send(datanode.root);
}

export async function getDataNode(
    request : FastifyRequest<{Params: ParamsSchema}>,
    reply : FastifyReply) {
    try {
        const node = getNode(request.params.id);
        reply.send(node);
    } catch (err) {
        reply.status(404).send(err);
    }
}

export async function getParents(
    request : FastifyRequest<{Params: ParamsSchema}>,
    reply : FastifyReply) {
    try {
        const node = getNode(request.params.id);
        reply.send([node.parent, ...node.parentLinks]);
    } catch (err) {
        reply.status(404).send(err);
    }
}

export async function getChildren(
    request : FastifyRequest<{Params: ParamsSchema}>,
    reply : FastifyReply) {
    try {
        const node = getNode(request.params.id);
        reply.send(node.children);
    } catch (err) {
        reply.status(404).send(err);
    }
}