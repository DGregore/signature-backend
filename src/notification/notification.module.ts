import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notification.gateway'; // Corrected import name
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationsGateway, NotificationService], // Use corrected name
  exports: [NotificationService, NotificationsGateway] // Export both for use in other modules
})
export class NotificationModule {}

