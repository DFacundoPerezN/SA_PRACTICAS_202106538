import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ASSIGNMENT_REPOSITORY,
} from '../interfaces/assignment-repository.interface';

import type {
  IAssignmentRepository
} from '../interfaces/assignment-repository.interface';

export interface UserCreatedEvent {
  userId: string;
  name:   string;
  email:  string;
  role:   string;
}

@Injectable()
export class HandleUserCreatedUseCase {
  private readonly logger = new Logger(HandleUserCreatedUseCase.name);

  constructor(
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignRepo: IAssignmentRepository,
  ) {}

  /**
   * RF-22: When a technician is registered, seed their row in technician_workload
   * with active_tickets = 0 so the auto-assign algorithm can pick them up.
   */
  async execute(event: UserCreatedEvent): Promise<void> {
    if (event.role !== 'tecnico') {
      this.logger.debug(
        `user.created for ${event.userId} with role '${event.role}' — skipping workload seed`,
      );
      return;
    }

    this.logger.log(
      `Seeding technician_workload for new technician ${event.userId} (${event.name})`,
    );

    // upsertWorkload with delta=0 ensures a row exists without changing any counter
    await this.assignRepo.upsertWorkload(event.userId, 0);

    this.logger.log(`technician_workload seeded for ${event.userId}`);
  }
}
