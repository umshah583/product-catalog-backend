import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Realtime gateway.
 *
 * Clients connect and join a tenant-specific room so that CRUD events
 * emitted by the admin portal are broadcast to all mobile/web clients
 * belonging to the same tenant.
 *
 * Event names emitted by the server:
 *  - product:created   { payload: Product }
 *  - product:updated   { payload: Product }
 *  - product:deleted   { payload: { id } }
 *  - category:created  { payload: Category }
 *  - category:updated  { payload: Category }
 *  - category:deleted  { payload: { id } }
 *  - settings:updated   { payload: Settings }
 *  - offer:created      { payload: PromotionalOffer }
 *  - offer:updated      { payload: PromotionalOffer }
 *  - offer:deleted      { payload: { id } }
 */
@WebSocketGateway({
  namespace: 'realtime',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit(server: Server) {
    this.logger.log('Realtime WebSocket gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    const tenantSlug =
      (client.handshake.query['tenant'] as string) ||
      (client.handshake.headers['x-tenant-slug'] as string) ||
      'default';
    const room = `tenant:${tenantSlug}`;
    client.join(room);
    this.logger.log(`Client connected: ${client.id} -> joined ${room}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Allow a client to switch tenant rooms at runtime.
   */
  @SubscribeMessage('joinTenant')
  handleJoinTenant(
    @MessageBody() tenantSlug: string,
    @ConnectedSocket() client: Socket,
  ) {
    const room = `tenant:${tenantSlug || 'default'}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    return { event: 'joined', data: { room } };
  }

  // ---- Helpers used by controllers/services to broadcast changes ----

  private broadcast(tenantSlug: string, event: string, payload: unknown) {
    const room = `tenant:${tenantSlug || 'default'}`;
    this.server.to(room).emit(event, payload);
  }

  emitProductCreated(tenantSlug: string, product: unknown) {
    this.broadcast(tenantSlug, 'product:created', product);
  }

  emitProductUpdated(tenantSlug: string, product: unknown) {
    this.broadcast(tenantSlug, 'product:updated', product);
  }

  emitProductDeleted(tenantSlug: string, id: string) {
    this.broadcast(tenantSlug, 'product:deleted', { id });
  }

  emitCategoryCreated(tenantSlug: string, category: unknown) {
    this.broadcast(tenantSlug, 'category:created', category);
  }

  emitCategoryUpdated(tenantSlug: string, category: unknown) {
    this.broadcast(tenantSlug, 'category:updated', category);
  }

  emitCategoryDeleted(tenantSlug: string, id: string) {
    this.broadcast(tenantSlug, 'category:deleted', { id });
  }

  emitSettingsUpdated(tenantSlug: string, settings: unknown) {
    this.broadcast(tenantSlug, 'settings:updated', settings);
  }

  emitOfferCreated(tenantSlug: string, offer: unknown) {
    this.broadcast(tenantSlug, 'offer:created', offer);
  }

  emitOfferUpdated(tenantSlug: string, offer: unknown) {
    this.broadcast(tenantSlug, 'offer:updated', offer);
  }

  emitOfferDeleted(tenantSlug: string, id: string) {
    this.broadcast(tenantSlug, 'offer:deleted', { id });
  }
}
