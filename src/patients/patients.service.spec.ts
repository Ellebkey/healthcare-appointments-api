/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PatientsService } from './patients.service';
import { Patient } from './schemas/patient.schema';
import { Counter } from './schemas/counter.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { NotFoundException } from '@nestjs/common';

describe('PatientsService', () => {
  let service: PatientsService;

  const mockPatient = {
    id: 1,
    name: 'John Doe',
    age: 30,
    gender: 'male',
    contact: 'john@example.com',
    save: jest.fn().mockResolvedValue({
      id: 1,
      name: 'John Doe',
      age: 30,
      gender: 'male',
      contact: 'john@example.com',
    }),
  };

  const mockPatientModel = jest
    .fn()
    .mockImplementation(() => mockPatient) as any;
  mockPatientModel.find = jest.fn();
  mockPatientModel.findOne = jest.fn();
  mockPatientModel.create = jest.fn();
  mockPatientModel.exec = jest.fn();

  const mockCounterModel = {
    findOneAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getModelToken(Patient.name),
          useValue: mockPatientModel,
        },
        {
          provide: getModelToken(Counter.name),
          useValue: mockCounterModel,
        },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new patient with auto-incremented ID', async () => {
      const createPatientDto: CreatePatientDto = {
        name: 'John Doe',
        age: 30,
        gender: 'male',
        contact: 'john@example.com',
      };

      mockCounterModel.findOneAndUpdate.mockResolvedValue({ seq: 1 });

      const result = await service.create(createPatientDto);

      expect(mockCounterModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'patients' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true },
      );
      expect(result).toEqual({
        id: 1,
        name: 'John Doe',
        age: 30,
        gender: 'male',
        contact: 'john@example.com',
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of patients', async () => {
      const mockPatients = [
        {
          id: 1,
          name: 'John Doe',
          age: 30,
          gender: 'male',
          contact: 'john@example.com',
        },
        {
          id: 2,
          name: 'Jane Doe',
          age: 25,
          gender: 'female',
          contact: 'jane@example.com',
        },
      ];

      const chainMock = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPatients),
      };

      mockPatientModel.find.mockReturnValue(chainMock);

      const result = await service.findAll();

      expect(result).toEqual(mockPatients);
      expect(mockPatientModel.find).toHaveBeenCalled();
      expect(chainMock.select).toHaveBeenCalledWith(
        'id name age gender contact',
      );
      expect(chainMock.limit).toHaveBeenCalledWith(50);
      expect(chainMock.exec).toHaveBeenCalled();
    });

    it('should return empty array when no patients exist', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      };

      mockPatientModel.find.mockReturnValue(chainMock);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single patient', async () => {
      const mockPatient = {
        id: 1,
        name: 'John Doe',
        age: 30,
        gender: 'male',
        contact: 'john@example.com',
      };

      const chainMock = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPatient),
      };

      mockPatientModel.findOne.mockReturnValue(chainMock);

      const result = await service.findOne(1);

      expect(result).toEqual(mockPatient);
      expect(mockPatientModel.findOne).toHaveBeenCalledWith({ id: 1 });
      expect(chainMock.select).toHaveBeenCalledWith(
        'id name age gender contact',
      );
      expect(chainMock.exec).toHaveBeenCalled();
    });

    it('should throw NotFoundException when patient not found', async () => {
      const chainMock = {
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      };

      mockPatientModel.findOne.mockReturnValue(chainMock);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Patient with ID 999 not found'),
      );
    });
  });
});
