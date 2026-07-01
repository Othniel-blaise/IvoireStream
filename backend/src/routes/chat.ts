import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';

// streamId → ensemble de clients connectés
const rooms = new Map<string, Set<WebSocket>>();

export default async function chatRoutes(app: FastifyInstance) {
  app.get('/:id', { websocket: true }, (socket: WebSocket, req) => {
    const { id } = req.params as { id: string };

    if (!rooms.has(id)) rooms.set(id, new Set());
    const room = rooms.get(id)!;
    room.add(socket);

    socket.on('message', (raw: Buffer) => {
      const data = raw.toString();
      // Diffuser à tous sauf l'expéditeur
      for (const client of room) {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    });

    socket.on('close', () => {
      room.delete(socket);
      if (room.size === 0) rooms.delete(id);
    });

    socket.on('error', () => {
      room.delete(socket);
    });
  });
}
