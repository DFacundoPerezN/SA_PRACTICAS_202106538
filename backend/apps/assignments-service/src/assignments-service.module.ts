import { Module } from '@nestjs/common';
import { AssignmentsServiceController } from './assignments-service.controller';
import { AssignmentsServiceService } from './assignments-service.service';

@Module({
  imports: [],
  controllers: [AssignmentsServiceController],
  providers: [AssignmentsServiceService],
})
export class AssignmentsServiceModule {}
