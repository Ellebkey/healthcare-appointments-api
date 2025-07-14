/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { FileUploadDto } from './dto/file-upload.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;
  let queue: Queue;

  const mockAppointment = {
    id: 1,
    doctor: 'Dr. Smith',
    appointment_date: '2024-10-21T10:00:00Z',
    reason: 'Annual check-up',
    patient: {
      id: 1,
      name: 'John Doe',
      age: 30,
      gender: 'male',
      contact: 'john@example.com',
    },
  };

  const mockAppointmentsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getJobs: jest.fn(),
    getJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
        {
          provide: getQueueToken('appointments'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
    queue = module.get<Queue>(getQueueToken('appointments'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of appointments', async () => {
      const mockAppointments = [mockAppointment];
      mockAppointmentsService.findAll.mockResolvedValue(mockAppointments);

      const result = await controller.findAll({});

      expect(result).toEqual(mockAppointments);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('should filter appointments by query parameters', async () => {
      const query: QueryAppointmentDto = {
        patient_id: 1,
        doctor: 'Dr. Smith',
      };
      const mockAppointments = [mockAppointment];
      mockAppointmentsService.findAll.mockResolvedValue(mockAppointments);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockAppointments);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a single appointment', async () => {
      mockAppointmentsService.findOne.mockResolvedValue(mockAppointment);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockAppointment);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('processCSV', () => {
    it('should queue CSV processing job', async () => {
      const fileUploadDto: FileUploadDto = {
        filepath: 'test-appointments.csv',
      };
      const mockJob = { id: '12345' } as any;
      mockQueue.add.mockResolvedValue(mockJob);

      const result = await controller.processCSV(fileUploadDto);

      expect(result).toEqual({
        message: 'CSV processing queued successfully',
        jobId: '12345',
      });
      expect(queue.add).toHaveBeenCalledWith('process-csv', {
        filepath: 'test-appointments.csv',
      });
    });
  });
});
