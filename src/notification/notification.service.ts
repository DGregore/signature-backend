import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notification.gateway'; // Import the gateway
import { DocumentSignatory } from '../document/document-signatory.entity'; // Adjust path
import { Document } from '../document/document.entity'; // Adjust path
import { User } from '../user/user.entity'; // Adjust path

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly notificationsGateway: NotificationsGateway) {}

  /**
   * Sends a generic notification to a specific user.
   */
  notifyUser(userId: number, event: string, data: any): void {
    this.logger.log(`Queueing notification event '${event}' for user ID ${userId}`);
    const sent = this.notificationsGateway.sendNotificationToUser(userId, event, data);
    if (!sent) {
      this.logger.warn(`User ID ${userId} not connected, notification '${event}' not sent in real-time.`);
      // TODO: Implement fallback (e.g., store notification in DB, send email later if implemented)
    }
  }

  /**
   * Notifies the next signatory/signatories that a document is ready for them.
   */
  notifySignatoriesDocumentReady(signatories: DocumentSignatory[]): void {
    if (!signatories || signatories.length === 0) {
      return;
    }
    this.logger.log(`Notifying ${signatories.length} signatories that document ${signatories[0].document?.id} is ready.`);
    signatories.forEach(sig => {
      // Ensure user object is loaded or use user ID directly
      const userId = sig.user?.id || (sig.user as any); // Handle cases where user might just be an ID
      if (userId) {
        this.notifyUser(userId, 'documentReadyForSigning', {
          documentId: sig.document?.id,
          documentTitle: sig.document?.title || sig.document?.originalFilename,
          message: `O documento "${sig.document?.title || sig.document?.originalFilename}" está pronto para sua assinatura.`,
        });
      }
    });
  }

  /**
   * Notifies the document owner and/or signatories that the document signing is complete.
   */
  notifyDocumentCompleted(document: Document): void {
    this.logger.log(`Notifying parties about completion of document ID ${document.id}`);
    const notificationData = {
      documentId: document.id,
      documentTitle: document.title || document.originalFilename,
      message: `O documento "${document.title || document.originalFilename}" foi assinado por todos.`,
    };

    // Notify owner
    if (document.owner?.id) {
      this.notifyUser(document.owner.id, 'documentCompleted', notificationData);
    }

    // Notify signatories (optional, depending on requirements)
    // document.signatories?.forEach(sig => {
    //   if (sig.user?.id) {
    //     this.notifyUser(sig.user.id, 'documentCompleted', notificationData);
    //   }
    // });
  }

  /**
   * Notifies the document owner and/or other signatories that a document was rejected.
   */
  notifyDocumentRejected(document: Document, rejectedBy: User, reason?: string | null): void {
    this.logger.log(`Notifying parties about rejection of document ID ${document.id} by user ID ${rejectedBy.id}`);
    const notificationData = {
      documentId: document.id,
      documentTitle: document.title || document.originalFilename,
      rejectedBy: rejectedBy.name,
      reason: reason,
      message: `O documento "${document.title || document.originalFilename}" foi rejeitado por ${rejectedBy.name}. Motivo: ${reason || 'Não especificado'}`,
    };

    // Notify owner
    if (document.owner?.id) {
      this.notifyUser(document.owner.id, 'documentRejected', notificationData);
    }

    // Notify other signatories (optional)
    // document.signatories?.forEach(sig => {
    //   if (sig.user?.id && sig.user.id !== rejectedBy.id) { // Don't notify the rejector
    //     this.notifyUser(sig.user.id, 'documentRejected', notificationData);
    //   }
    // });
  }

   /**
   * Notifies the document owner that a document was cancelled.
   */
  notifyDocumentCancelled(document: Document): void {
    this.logger.log(`Notifying owner about cancellation of document ID ${document.id}`);
    const notificationData = {
      documentId: document.id,
      documentTitle: document.title || document.originalFilename,
      message: `O fluxo de assinatura do documento "${document.title || document.originalFilename}" foi cancelado.`,
    };

    // Notify owner
    if (document.owner?.id) {
      this.notifyUser(document.owner.id, 'documentCancelled', notificationData);
    }
    // Optionally notify signatories too
  }

  // Add more specific notification methods as needed
}

