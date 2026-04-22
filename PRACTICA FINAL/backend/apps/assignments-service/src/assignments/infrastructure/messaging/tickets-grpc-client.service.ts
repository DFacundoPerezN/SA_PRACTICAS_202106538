import {
  Injectable, Logger, OnModuleInit,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { ITicketsGrpcClient } from '../../application/interfaces/tickets-grpc-client.interface';

export const TICKETS_GRPC_CLIENT = 'TICKETS_GRPC_CLIENT_INTERNAL';

interface TicketsGrpcServiceRpc {
  assignTicket(data: {
    ticketId:     string;
    technicianId: string;
    assignedBy:   string;
  }): any;
}

/**
 * Concrete adapter that calls tickets-service via gRPC.
 * The application layer only knows about ITicketsGrpcClient.
 */
@Injectable()
export class TicketsGrpcClientService implements ITicketsGrpcClient, OnModuleInit {
  private readonly logger = new Logger(TicketsGrpcClientService.name);
  private ticketsRpc!: TicketsGrpcServiceRpc;

  constructor(
    @Inject(TICKETS_GRPC_CLIENT) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.ticketsRpc = this.client.getService<TicketsGrpcServiceRpc>('TicketsService');
  }

  async assignTicket(data: {
    ticketId:     string;
    technicianId: string;
    assignedBy:   string;
  }): Promise<void> {
    try {
      await firstValueFrom(this.ticketsRpc.assignTicket(data));
      this.logger.debug(`assignTicket OK → ticket=${data.ticketId}`);
    } catch (err) {
      this.logger.error(
        `assignTicket failed for ticket ${data.ticketId}: ${(err as Error).message}`,
      );
      throw err;   // caller decides whether to swallow
    }
  }
}
