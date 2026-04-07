import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsServiceController } from './assignments-service.controller';
import { AssignmentsServiceService } from './assignments-service.service';

describe('AssignmentsServiceController', () => {
  let assignmentsServiceController: AssignmentsServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsServiceController],
      providers: [AssignmentsServiceService],
    }).compile();

    assignmentsServiceController = app.get<AssignmentsServiceController>(AssignmentsServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(assignmentsServiceController.getHello()).toBe('Hello World!');
    });
  });
});
