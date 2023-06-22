import { 
    FastifyInstance,
    RouteShorthandOptions,
} from "fastify";
import {
    getRoot,
    getDataNode,
    getParents,
    getChildren
} from '../controllers/datanode';
import ParamsSchema from '../schemas/datanode/paramsschema.json';
import { ParamsSchema as iParamsSchema } from '../types/datanode/paramsschema';
import DataNodeSchema from "../schemas/datanode/datanodeschema.json";
import { DataNodeSchema as iDataNodeSchema } from "../types/datanode/datanodeschema";


export async function datanodeRoutes(fastify : FastifyInstance, 
                                opts : RouteShorthandOptions) {
    fastify.get<{
        Params: iParamsSchema
    }>('/datanode/root', {
        schema: {
            params: ParamsSchema,
            response: {
                200: DataNodeSchema,
            }
        }
    }, getRoot);
    fastify.get<{
        Params: iParamsSchema
    }>('/datanode/:id', {
        schema: {
            params: ParamsSchema,
            response: {
                200: DataNodeSchema,
                404: { type: 'string'}
            }
        }
    }, getDataNode);
    fastify.get<{
        Params: iParamsSchema
    }>('/datanode/:id/parents', {
        schema: {
            params: ParamsSchema,
            response: {
                200: {
                    type: 'array',
                    items: DataNodeSchema
                },
                404: { type: 'string'}
            }
        }
    }, getParents);
    fastify.get<{
        Params: iParamsSchema,
    }>('/datanode/:id/children', {
        schema: {
            params: ParamsSchema,
            response: {
                200: {
                    type: 'array',
                    items: DataNodeSchema
                },
                404: { type: 'string'}
            }
        }
    }, getChildren);
}