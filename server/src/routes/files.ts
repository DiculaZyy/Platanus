import { 
    FastifyInstance,
    RouteShorthandOptions,
} from "fastify";
import { open } from '../controllers/files'
import DirSchema from "../schemas/datanode/dirschema.json";
import { DirSchema as iDirSchema } from "../types/datanode/dirschema";

export async function filesRoutes(fastify : FastifyInstance, 
                                opts : RouteShorthandOptions) {
    fastify.post<{
        Body: iDirSchema
    }>('/open', {
        schema: {
            body: DirSchema
        }
    }, open);
}