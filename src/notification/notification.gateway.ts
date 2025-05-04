import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Configure the gateway, e.g., port, namespace, CORS
// The port here might conflict if the main NestJS app runs on the same port.
// Often, the WebSocket server integrates with the existing HTTP server.
// Let's assume integration with the main app's port and allow CORS.
@WebSocketGateway({
  cors: {
    origin: '*', // Allow all origins for now, restrict in production
  },
  // namespace: '/notifications', // Optional: Use a namespace
})
export class NotificationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');
  private connectedUsers: Map<number, string> = new Map(); // Map userId to socketId

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    // Here you would typically authenticate the user (e.g., via JWT in handshake query)
    // For now, let's assume a user ID is sent via a message after connection
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove user from map on disconnect
    let userIdToRemove: number | null = null;
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        userIdToRemove = userId;
        break;
      }
    }
    if (userIdToRemove !== null) {
      this.connectedUsers.delete(userIdToRemove);
      this.logger.log(`Removed user ID ${userIdToRemove} from connected users map.`);
    }
  }

  // Example message handler for user registration
  @SubscribeMessage('registerUser')
  handleRegisterUser(@MessageBody() userId: number, @ConnectedSocket() client: Socket): void {
    if (userId && client.id) {
      this.connectedUsers.set(userId, client.id);
      this.logger.log(`Registered user ID ${userId} with socket ID ${client.id}`);
      // Optionally send confirmation back to client
      client.emit('registrationSuccess', { userId: userId });
    }
  }

  // Method to send a notification to a specific user
  sendNotificationToUser(userId: number, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.logger.log(`Sending event '${event}' to user ID ${userId} (socket ID: ${socketId})`);
      this.server.to(socketId).emit(event, data);
      return true;
    } else {
      this.logger.log(`User ID ${userId} not connected, cannot send event '${event}'`);
      return false;
    }
  }

  // Method to broadcast a notification to all connected clients (use with caution)
  broadcastNotification(event: string, data: any): void {
    this.logger.log(`Broadcasting event '${event}' to all connected clients`);
    this.server.emit(event, data);
  }

  // Example: Handle a message from a client (if needed)
  // @SubscribeMessage('messageToServer')
  // handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket): void {
  //   this.logger.log(`Received message from ${client.id}: ${JSON.stringify(data)}`);
  //   // Process message, maybe broadcast or send to specific user
  // }
}

