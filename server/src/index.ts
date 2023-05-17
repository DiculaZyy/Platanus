import { fastify, FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http'
import { datanodeRoutes } from './routes/datanode';
import { open as DataNodeOpen } from './models/datanode';
import { PORT, RootDir, LogPath } from './config/constant';
import * as path from 'path';
import * as fs from 'fs';

if (!fs.existsSync(path.dirname(LogPath)))
    fs.mkdirSync(path.dirname(LogPath));

const server : FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
    logger : {
        file: LogPath
    }
});


server.register(datanodeRoutes);

const start = async () => {
    try {
        await DataNodeOpen(RootDir);
        await server.listen({ port : PORT });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();