import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

interface CSVRow {
  patient_id: string;
  doctor: string;
  appointment_date: string;
  reason: string;
}

@Processor('appointments')
@Injectable()
export class AppointmentsProcessor {
  private readonly logger = new Logger(AppointmentsProcessor.name);

  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Process('process-csv')
  async handleCSVProcessing(job: Job<{ filepath: string }>) {
    const { filepath } = job.data;
    this.logger.log(`🚀 Starting CSV processing - Job ID: ${job.id}`);
    this.logger.log(`📁 File path: ${filepath}`);

    try {
      const appointments = await this.parseCSVFile(filepath);
      this.logger.log(
        `📊 Total appointments to process: ${appointments.length}`,
      );

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process with progress updates
      for (let i = 0; i < appointments.length; i++) {
        try {
          await this.appointmentsService.create(appointments[i]);
          successCount++;

          // Log progress every 10 appointments
          if ((i + 1) % 10 === 0) {
            await job.progress(((i + 1) / appointments.length) * 100);
            this.logger.log(
              `📈 Progress: ${i + 1}/${appointments.length} (${Math.round(((i + 1) / appointments.length) * 100)}%)`,
            );
          }
        } catch (error) {
          errorCount++;
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Row ${i + 1}: ${errorMessage}`);
          this.logger.error(`❌ Failed at row ${i + 1}: ${errorMessage}`);
        }
      }

      this.logger.log(`✅ CSV processing completed!`);
      this.logger.log(
        `📊 Results - Success: ${successCount}, Errors: ${errorCount}`,
      );

      return {
        success: true,
        jobId: job.id,
        totalRows: appointments.length,
        processed: successCount,
        failed: errorCount,
        errors: errors.slice(0, 10), // Return first 10 errors
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`💥 Failed to process CSV file: ${errorMessage}`);
      throw new Error(`Failed to process CSV file: ${errorMessage}`);
    }
  }

  private parseCSVFile(filepath: string): Promise<CreateAppointmentDto[]> {
    return new Promise((resolve, reject) => {
      const appointments: CreateAppointmentDto[] = [];

      if (!fs.existsSync(filepath)) {
        reject(new Error(`File not found: ${filepath}`));
        return;
      }

      fs.createReadStream(filepath)
        .pipe(csvParser())
        .on('data', (row: CSVRow) => {
          try {
            const appointment: CreateAppointmentDto = {
              patient_id: parseInt(row.patient_id, 10),
              doctor: row.doctor,
              appointment_date: row.appointment_date,
              reason: row.reason,
            };

            // Basic validation
            if (isNaN(appointment.patient_id)) {
              throw new Error(`Invalid patient_id: ${row.patient_id}`);
            }

            appointments.push(appointment);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Invalid row in CSV: ${errorMessage}`);
          }
        })
        .on('end', () => {
          this.logger.log(
            `Parsed ${appointments.length} appointments from CSV`,
          );
          resolve(appointments);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
}
