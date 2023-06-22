import * as datanode from '../models/datanode';

import { DirSchema as iDirSchema } from "../types/datanode/dirschema";

import {
    FastifyRequest,
    FastifyReply
} from 'fastify';

export async function open(
    request : FastifyRequest<{Body: iDirSchema}>,
    reply : FastifyReply) {
    console.log(request.body);
    if (request.body.dir) {
        const root = await datanode.open(request.body.dir, request.body.maxDepth || -1);
        return root
    }
    else {
        throw { statusCode : 418, message : "dir can't be null." };

    }

}