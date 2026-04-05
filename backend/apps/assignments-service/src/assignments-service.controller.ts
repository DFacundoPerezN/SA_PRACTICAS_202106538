import { Controller, Get } from '@nestjs/common';
import { AssignmentsServiceService } from './assignments-service.service';

@Controller()
export class AssignmentsServiceController {
  constructor(private readonly assignmentsServiceService: AssignmentsServiceService) {}

  @Get()
  getHello(): string {
    return this.assignmentsServiceService.getHello();
  }
}
