import { fastify, FastifyInstance } from 'fastify';
import cors from '@fastify/cors'
import { Server, IncomingMessage, ServerResponse } from 'http'
import { datanodeRoutes } from './routes/datanode';
import { filesRoutes } from './routes/files';
import { PORT, LogPath } from './config/constant';
import * as path from 'path';
import * as fs from 'fs';

if (!fs.existsSync(path.dirname(LogPath)))
    fs.mkdirSync(path.dirname(LogPath));

const server : FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
    logger : {
        file: LogPath
    }
});




const start = async () => {
    await server.register(datanodeRoutes);
    await server.register(filesRoutes);
    await server.register(cors);
    try {
        await server.listen({ port : PORT });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();