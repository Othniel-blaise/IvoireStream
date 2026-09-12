import { FastifyInstance } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { WebSocket } from 'ws';
import { prisma } from '../lib/prisma';

// ─────────────────────────────────────────────────────────────────────────
//  Présence + chat temps réel d'un live.
//  Le serveur est la seule source de vérité du nombre de viewers :
//  viewerCount = nombre de viewers uniques connectés à la room (hors hôte).
//  Un viewer qui perd le réseau / tue l'app est détecté par ping/pong et
//  retiré automatiquement — plus besoin de /view et /unview côté client.
// ─────────────────────────────────────────────────────────────────────────

const PING_INTERVAL_MS = 30_000;  // détection des sockets mortes
const PERSIST_DEBOUNCE = 5_000;   // écriture DB du viewerCount
const HOST_GRACE_MS    = 60_000;  // délai avant clôture si l'hôte disparaît
const MAX_MESSAGE_LEN  = 300;

interface Member {
  userId?: string;                 // undefined = anonyme
  isHost:  boolean;
  alive:   boolean;
  author?: { id: string; username: string; avatarEmoji: string };
}

interface Room {
  hostId:       string;
  members:      Map<WebSocket, Member>;
  seen:         Set<string>;       // viewers uniques déjà comptés dans totalViewers
  peak:         number;
  persistTimer: NodeJS.Timeout | null;
  hostGrace:    NodeJS.Timeout | null;
}

const rooms = new Map<string, Room>();

// ── Helpers ───────────────────────────────────────────────────────────────
function countViewers(room: Room): number {
  const ids = new Set<string>();
  let anonymous = 0;
  for (const m of room.members.values()) {
    if (m.isHost) continue;
    if (m.userId) ids.add(m.userId); else anonymous++;
  }
  return ids.size + anonymous;
}

function hasHost(room: Room): boolean {
  for (const m of room.members.values()) if (m.isHost) return true;
  return false;
}

function broadcast(room: Room, payload: object, except?: WebSocket) {
  const data = JSON.stringify(payload);
  for (const ws of room.members.keys()) {
    if (ws !== except && ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function schedulePersist(streamId: string, room: Room) {
  if (room.persistTimer) return;
  room.persistTimer = setTimeout(async () => {
    room.persistTimer = null;
    await prisma.liveStream.updateMany({
      where: { id: streamId, isLive: true },
      data:  { viewerCount: countViewers(room), peakViewers: room.peak },
    }).catch(() => {});
  }, PERSIST_DEBOUNCE);
}

function notifyViewers(streamId: string, room: Room) {
  const count = countViewers(room);
  if (count > room.peak) room.peak = count;
  broadcast(room, { type: 'viewers', count });
  schedulePersist(streamId, room);
}

function scheduleHostTimeout(streamId: string, room: Room) {
  if (room.hostGrace) return;
  room.hostGrace = setTimeout(() => {
    room.hostGrace = null;
    if (!hasHost(room)) endLiveRoom(streamId, 'timeout');
  }, HOST_GRACE_MS);
}

/** Clôture le live en DB, prévient la room et ferme les sockets. */
export async function endLiveRoom(streamId: string, reason: 'host' | 'timeout' = 'host') {
  const room = rooms.get(streamId);

  await prisma.liveStream.updateMany({
    where: { id: streamId, isLive: true },
    data:  { isLive: false, endedAt: new Date(), viewerCount: 0, ...(room ? { peakViewers: room.peak } : {}) },
  }).catch(() => {});

  if (!room) return;
  if (room.persistTimer) clearTimeout(room.persistTimer);
  if (room.hostGrace)    clearTimeout(room.hostGrace);
  rooms.delete(streamId);
  broadcast(room, { type: 'ended', reason });
  for (const ws of room.members.keys()) {
    try { ws.close(1000, 'ended'); } catch {}
  }
}

/** Lecture instantanée (utilisée par GET /api/streams/:id/viewers). */
export function liveViewerCount(streamId: string): number | null {
  const room = rooms.get(streamId);
  return room ? countViewers(room) : null;
}

// ── Route WS : /api/chat/:id?token=<jwt> ─────────────────────────────────
export default async function chatRoutes(app: FastifyInstance) {

  // Ping/pong global : une socket muette est terminée → décrément automatique
  const heartbeat = setInterval(() => {
    for (const room of rooms.values()) {
      for (const [ws, m] of room.members) {
        if (!m.alive) { ws.terminate(); continue; }
        m.alive = false;
        try { ws.ping(); } catch {}
      }
    }
  }, PING_INTERVAL_MS);
  app.addHook('onClose', async () => clearInterval(heartbeat));

  app.get('/:id', { websocket: true }, async (connection: SocketStream, req) => {
    const { id }    = req.params as { id: string };
    const { token } = req.query  as { token?: string };
    const socket    = connection.socket;

    // 1. Le live doit exister et être en cours
    const stream = await prisma.liveStream.findUnique({
      where: { id }, select: { hostId: true, isLive: true, peakViewers: true },
    });
    if (!stream || !stream.isLive) {
      socket.send(JSON.stringify({ type: 'ended', reason: 'not_live' }));
      socket.close(1000, 'not_live');
      return;
    }

    // 2. Identité : JWT vérifié (signature), pas seulement décodé. Anonyme sinon.
    let userId: string | undefined;
    let author: Member['author'];
    if (token) {
      try {
        userId = (app.jwt.verify(token) as { userId: string }).userId;
        const u = await prisma.user.findUnique({
          where: { id: userId }, select: { id: true, username: true, avatarEmoji: true },
        });
        if (u) author = u; else userId = undefined;
      } catch { userId = undefined; }
    }
    const isHost = !!userId && userId === stream.hostId;

    // 3. Room
    let room = rooms.get(id);
    if (!room) {
      room = {
        hostId: stream.hostId, members: new Map(), seen: new Set(),
        peak: stream.peakViewers, persistTimer: null, hostGrace: null,
      };
      rooms.set(id, room);
    }
    const member: Member = { userId, isHost, alive: true, author };
    room.members.set(socket, member);

    if (isHost && room.hostGrace) { clearTimeout(room.hostGrace); room.hostGrace = null; }

    // Viewer unique → stat cumulative de l'hôte (1 fois par live et par viewer)
    if (!isHost) {
      const key = userId ?? `anon:${Math.random().toString(36).slice(2)}`;
      if (!room.seen.has(key)) {
        room.seen.add(key);
        prisma.wallet.updateMany({
          where: { userId: stream.hostId }, data: { totalViewers: { increment: 1 } },
        }).catch(() => {});
      }
    }

    socket.on('pong', () => { member.alive = true; });

    // État initial pour le nouvel arrivant, puis diffusion à toute la room
    notifyViewers(id, room);

    // 4. Messages entrants — seuls les utilisateurs authentifiés peuvent parler
    socket.on('message', (raw: Buffer) => {
      let msg: { type?: string; text?: string };
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type !== 'chat' || !author) return;

      const text = String(msg.text ?? '').trim().slice(0, MAX_MESSAGE_LEN);
      if (!text) return;

      const sentAt = new Date();
      const r = rooms.get(id);
      if (r) broadcast(r, { type: 'chat', id: `${sentAt.getTime()}-${author.id}`, author, text, sentAt }, socket);

      prisma.comment.create({ data: { streamId: id, authorId: author.id, text, sentAt } }).catch(() => {});
    });

    // 5. Départ (fermeture propre, erreur, ou ping/pong échoué)
    const leave = () => {
      const r = rooms.get(id);
      if (!r || !r.members.has(socket)) return;
      r.members.delete(socket);

      notifyViewers(id, r);

      // L'hôte est parti sans clôturer : HOST_GRACE_MS pour revenir, sinon fin du live
      if (isHost && !hasHost(r)) scheduleHostTimeout(id, r);

      // Room vide et pas d'hôte attendu : on libère (le live reste ouvert en DB pour l'hôte)
      if (r.members.size === 0 && !r.hostGrace) {
        if (r.persistTimer) clearTimeout(r.persistTimer);
        rooms.delete(id);
        prisma.liveStream.updateMany({
          where: { id, isLive: true }, data: { viewerCount: 0, peakViewers: r.peak },
        }).catch(() => {});
      }
    };

    socket.on('close', leave);
    socket.on('error', leave);
  });
}
