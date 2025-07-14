/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-require-imports */
import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsProcessor } from './appointments.processor';
import { AppointmentsService } from './appointments.service';
import { Job } from 'bull';
import * as fs from 'fs';
import { EventEmitter } from 'events';

// Mock fs module
jest.mock('fs');
// Mock csv-parser
jest.mock('csv-parser', () => {
  return jest.fn(() => {
    const { Transform } = require('stream');
    return new Transform({
      objectMode: true,
      transform(chunk: any, encoding: any, callback: any) {
        this.push(chunk);
        callback();
      },
    });
  });
});

describe('AppointmentsProcessor', () => {
  let processor: AppointmentsProcessor;
  let appointmentsService: AppointmentsService;
  let mockJob: Partial<Job>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  const mockAppointmentsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsProcessor,
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
        },
      ],
    }).compile();

    processor = module.get<AppointmentsProcessor>(AppointmentsProcessor);
    appointmentsService = module.get<AppointmentsService>(AppointmentsService);

    mockJob = {
      id: '12345',
      data: { filepath: 'test.csv' },
      progress: jest.fn().mockResolvedValue(null),
    };

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('handleCSVProcessing', () => {
    const createMockStream = () => {
      const stream = new EventEmitter() as any;
      stream.pipe = jest.fn().mockReturnValue(stream);
      return stream;
    };

    it('should successfully process a CSV file with valid appointments', async () => {
      const mockCsvData = [
        {
          patient_id: '1',
          doctor: 'Dr. Smith',
          appointment_date: '2024-10-21T10:00:00Z',
          reason: 'Annual check-up',
        },
        {
          patient_id: '2',
          doctor: 'Dr. Johnson',
          appointment_date: '2024-10-22T14:30:00Z',
          reason: 'Consultation',
        },
      ];

      // Mock fs.existsSync
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Mock the stream
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      // Mock successful appointment creation
      mockAppointmentsService.create.mockResolvedValue({});

      // Start processing
      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      // Simulate CSV parsing
      setTimeout(() => {
        mockCsvData.forEach((data) => {
          mockStream.emit('data', data);
        });
        mockStream.emit('end');
      }, 10);

      const result = await processPromise;

      expect(result).toEqual({
        success: true,
        jobId: '12345',
        totalRows: 2,
        processed: 2,
        failed: 0,
        errors: [],
      });

      expect(appointmentsService.create).toHaveBeenCalledTimes(2);
      expect(appointmentsService.create).toHaveBeenCalledWith({
        patient_id: 1,
        doctor: 'Dr. Smith',
        appointment_date: '2024-10-21T10:00:00Z',
        reason: 'Annual check-up',
      });
    });

    it('should handle appointments with errors and continue processing', async () => {
      const mockCsvData = [
        {
          patient_id: '1',
          doctor: 'Dr. Smith',
          appointment_date: '2024-10-21T10:00:00Z',
          reason: 'Annual check-up',
        },
        {
          patient_id: '2',
          doctor: 'Dr. Johnson',
          appointment_date: '2024-10-22T14:30:00Z',
          reason: 'Consultation',
        },
        {
          patient_id: '3',
          doctor: 'Dr. Williams',
          appointment_date: '2024-10-23T09:15:00Z',
          reason: 'Follow-up',
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      // Mock appointment creation - fail on second appointment
      mockAppointmentsService.create
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('Duplicate appointment'))
        .mockResolvedValueOnce({});

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        mockCsvData.forEach((data) => {
          mockStream.emit('data', data);
        });
        mockStream.emit('end');
      }, 10);

      const result = await processPromise;

      expect(result).toEqual({
        success: true,
        jobId: '12345',
        totalRows: 3,
        processed: 2,
        failed: 1,
        errors: ['Row 2: Duplicate appointment'],
      });

      expect(appointmentsService.create).toHaveBeenCalledTimes(3);
    });

    it('should skip rows with invalid patient_id', async () => {
      const mockCsvData = [
        {
          patient_id: 'invalid',
          doctor: 'Dr. Smith',
          appointment_date: '2024-10-21T10:00:00Z',
          reason: 'Annual check-up',
        },
        {
          patient_id: '2',
          doctor: 'Dr. Johnson',
          appointment_date: '2024-10-22T14:30:00Z',
          reason: 'Consultation',
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      mockAppointmentsService.create.mockResolvedValue({});

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        mockCsvData.forEach((data) => {
          mockStream.emit('data', data);
        });
        mockStream.emit('end');
      }, 10);

      const result = await processPromise;

      // Only 1 appointment should be processed (the valid one)
      expect(result).toEqual({
        success: true,
        jobId: '12345',
        totalRows: 1,
        processed: 1,
        failed: 0,
        errors: [],
      });

      expect(appointmentsService.create).toHaveBeenCalledTimes(1);
      expect(appointmentsService.create).toHaveBeenCalledWith({
        patient_id: 2,
        doctor: 'Dr. Johnson',
        appointment_date: '2024-10-22T14:30:00Z',
        reason: 'Consultation',
      });
    });

    it('should update progress for large files', async () => {
      const mockCsvData = Array.from({ length: 25 }, (_, i) => ({
        patient_id: String(i + 1),
        doctor: 'Dr. Smith',
        appointment_date: '2024-10-21T10:00:00Z',
        reason: 'Check-up',
      }));

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      mockAppointmentsService.create.mockResolvedValue({});

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        mockCsvData.forEach((data) => {
          mockStream.emit('data', data);
        });
        mockStream.emit('end');
      }, 10);

      await processPromise;

      // Progress should be called at 10, 20 appointments
      expect(mockJob.progress).toHaveBeenCalledTimes(2);
      expect(mockJob.progress).toHaveBeenCalledWith(40); // 10/25 * 100
      expect(mockJob.progress).toHaveBeenCalledWith(80); // 20/25 * 100
    });

    it('should throw error when file does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(
        processor.handleCSVProcessing(mockJob as Job),
      ).rejects.toThrow('Failed to process CSV file: File not found: test.csv');

      expect(appointmentsService.create).not.toHaveBeenCalled();
    });

    it('should handle stream errors', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        mockStream.emit('error', new Error('Stream error'));
      }, 10);

      await expect(processPromise).rejects.toThrow(
        'Failed to process CSV file: Stream error',
      );

      expect(appointmentsService.create).not.toHaveBeenCalled();
    });

    it('should limit errors returned to 10', async () => {
      const mockCsvData = Array.from({ length: 15 }, (_, i) => ({
        patient_id: String(i + 1),
        doctor: 'Dr. Smith',
        appointment_date: '2024-10-21T10:00:00Z',
        reason: 'Check-up',
      }));

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      // Make all appointments fail
      mockAppointmentsService.create.mockRejectedValue(
        new Error('Database error'),
      );

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        mockCsvData.forEach((data) => {
          mockStream.emit('data', data);
        });
        mockStream.emit('end');
      }, 10);

      const result = await processPromise;

      expect(result.failed).toBe(15);
      expect(result.errors).toHaveLength(10); // Limited to 10 errors
      expect(result.errors[0]).toBe('Row 1: Database error');
      expect(result.errors[9]).toBe('Row 10: Database error');
    });

    it('should handle non-Error objects thrown', async () => {
      const mockCsvData = [
        {
          patient_id: '1',
          doctor: 'Dr. Smith',
          appointment_date: '2024-10-21T10:00:00Z',
          reason: 'Annual check-up',
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      // Mock appointment creation to throw a non-Error object
      mockAppointmentsService.create.mockRejectedValue('String error');

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        mockCsvData.forEach((data) => {
          mockStream.emit('data', data);
        });
        mockStream.emit('end');
      }, 10);

      const result = await processPromise;

      expect(result).toEqual({
        success: true,
        jobId: '12345',
        totalRows: 1,
        processed: 0,
        failed: 1,
        errors: ['Row 1: Unknown error'],
      });
    });

    it('should handle empty CSV file', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      const mockStream = createMockStream();
      (fs.createReadStream as jest.Mock).mockReturnValue(mockStream);

      const processPromise = processor.handleCSVProcessing(mockJob as Job);

      setTimeout(() => {
        // No data events, just end
        mockStream.emit('end');
      }, 10);

      const result = await processPromise;

      expect(result).toEqual({
        success: true,
        jobId: '12345',
        totalRows: 0,
        processed: 0,
        failed: 0,
        errors: [],
      });

      expect(appointmentsService.create).not.toHaveBeenCalled();
    });
  });
});
