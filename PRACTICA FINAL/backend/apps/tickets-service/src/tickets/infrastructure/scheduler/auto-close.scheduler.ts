import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AutoCloseTicketsUseCase } from '../../application/use-cases/auto-close-tickets.use-case';

@Injectable()
export class AutoCloseScheduler {
  private readonly logger = new Logger(AutoCloseScheduler.name);

  constructor(
    private readonly autoCloseUseCase: AutoCloseTicketsUseCase,
  ) {}

  // Runs every hour — adjust via CRON_AUTO_CLOSE env var if needed
  @Cron(CronExpression.EVERY_HOUR)
  async handleAutoClose(): Promise<void> {
    this.logger.log('Running auto-close job...');
    try {
      const count = await this.autoCloseUseCase.execute();
      this.logger.log(`Auto-close job finished. Tickets closed: ${count}`);
    } catch (err) {
      this.logger.error('Auto-close job failed', (err as Error).stack);
    }
  }
}
