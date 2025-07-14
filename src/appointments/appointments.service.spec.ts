/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bull';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './schemas/appointment.schema';
import { Counter } from '../patients/schemas/counter.schema';
import { Patient } from '../patients/schemas/patient.schema';
import { Queue } from 'bull';
import { NotFoundException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { QueryAppointmentDto } from './dto/query-appointment.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let queue: Queue;

  const mockAppointment = {
    id: 1,
    patient_id: 1,
    doctor: 'Dr. Smith',
    appointment_date: '2024-10-21T10:00:00Z',
    reason: 'Annual check-up',
    save: jest.fn().mockResolvedValue({
      id: 1,
      patient_id: 1,
      doctor: 'Dr. Smith',
      appointment_date: '2024-10-21T10:00:00Z',
      reason: 'Annual check-up',
    }),
  };

  const mockAppointmentModel = jest
    .fn()
    .mockImplementation(() => mockAppointment) as any;
  mockAppointmentModel.aggregate = jest.fn();

  const mockCounterModel = {
    findOneAndUpdate: jest.fn(),
  };

  const mockPatientModel = {};

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getModelToken(Appointment.name),
          useValue: mockAppointmentModel,
        },
        {
          provide: getModelToken(Counter.name),
          useValue: mockCounterModel,
        },
        {
          provide: getModelToken(Patient.name),
          useValue: mockPatientModel,
        },
        {
          provide: getQueueToken('appointments'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    queue = module.get<Queue>(getQueueToken('appointments'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all appointments with patient data', async () => {
      const mockResults = [
        {
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
        },
      ];

      const aggregateMock = {
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockResults),
      };

      mockAppointmentModel.aggregate.mockReturnValue(aggregateMock);

      const result = await service.findAll({});

      expect(result).toEqual(mockResults);
      expect(mockAppointmentModel.aggregate).toHaveBeenCalled();
      expect(aggregateMock.limit).toHaveBeenCalledWith(50);
    });

    it('should filter appointments by patient_id', async () => {
      const query: QueryAppointmentDto = { patient_id: 1 };
      const aggregateMock = {
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAppointmentModel.aggregate.mockReturnValue(aggregateMock);

      await service.findAll(query);

      const aggregateCall = mockAppointmentModel.aggregate.mock.calls[0][0];
      expect(aggregateCall[0]).toEqual({ $match: { patient_id: 1 } });
    });

    it('should filter appointments by doctor', async () => {
      const query: QueryAppointmentDto = { doctor: 'Dr. Smith' };
      const aggregateMock = {
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAppointmentModel.aggregate.mockReturnValue(aggregateMock);

      await service.findAll(query);

      const aggregateCall = mockAppointmentModel.aggregate.mock.calls[0][0];
      expect(aggregateCall[0]).toEqual({ $match: { doctor: 'Dr. Smith' } });
    });
  });

  describe('findOne', () => {
    it('should return a single appointment with patient data', async () => {
      const mockResult = [
        {
          id: 1,
          patient_id: 1,
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
        },
      ];

      const aggregateMock = {
        exec: jest.fn().mockResolvedValue(mockResult),
      };

      mockAppointmentModel.aggregate.mockReturnValue(aggregateMock);

      const result = await service.findOne(1);

      expect(result).toEqual(mockResult[0]);
      const aggregateCall = mockAppointmentModel.aggregate.mock.calls[0][0];
      expect(aggregateCall[0]).toEqual({ $match: { id: 1 } });
    });

    it('should throw NotFoundException when appointment not found', async () => {
      const aggregateMock = {
        exec: jest.fn().mockResolvedValue([]),
      };

      mockAppointmentModel.aggregate.mockReturnValue(aggregateMock);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Appointment with ID 999 not found'),
      );
    });
  });

  describe('create', () => {
    it('should create a new appointment with auto-incremented ID', async () => {
      const createAppointmentDto: CreateAppointmentDto = {
        patient_id: 1,
        doctor: 'Dr. Smith',
        appointment_date: '2024-10-21T10:00:00Z',
        reason: 'Annual check-up',
      };

      mockCounterModel.findOneAndUpdate.mockResolvedValue({ seq: 1 });

      const result = await service.create(createAppointmentDto);

      expect(mockCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'appointments' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      expect(result).toEqual({
        id: 1,
        patient_id: 1,
        doctor: 'Dr. Smith',
        appointment_date: '2024-10-21T10:00:00Z',
        reason: 'Annual check-up',
      });
    });
  });

  describe('queueCSVProcessing', () => {
    it('should queue CSV processing job', async () => {
      const filepath = 'test-appointments.csv';
      mockQueue.add.mockResolvedValue({ id: '12345' });

      await service.queueCSVProcessing(filepath);

      expect(queue.add).toHaveBeenCalledWith('process-csv', { filepath });
    });
  });
});
