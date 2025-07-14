/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { NotFoundException } from '@nestjs/common';

describe('PatientsController', () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockPatient = {
    id: 1,
    name: 'John Doe',
    age: 30,
    gender: 'male',
    contact: 'john@example.com',
  };

  const mockPatientsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        {
          provide: PatientsService,
          useValue: mockPatientsService,
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new patient', async () => {
      const createPatientDto: CreatePatientDto = {
        name: 'John Doe',
        age: 30,
        gender: 'male',
        contact: 'john@example.com',
      };

      mockPatientsService.create.mockResolvedValue(mockPatient);

      const result = await controller.create(createPatientDto);

      expect(result).toEqual(mockPatient);
      expect(service.create).toHaveBeenCalledWith(createPatientDto);
      expect(service.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return an array of patients', async () => {
      const mockPatients = [
        mockPatient,
        { ...mockPatient, id: 2, name: 'Jane Doe' },
      ];
      mockPatientsService.findAll.mockResolvedValue(mockPatients);

      const result = await controller.findAll();

      expect(result).toEqual(mockPatients);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no patients exist', async () => {
      mockPatientsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return a single patient', async () => {
      mockPatientsService.findOne.mockResolvedValue(mockPatient);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockPatient);
      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when patient not found', async () => {
      mockPatientsService.findOne.mockRejectedValue(
        new NotFoundException('Patient with ID 999 not found'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(
        NotFoundException,
      );
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });
});
