# Healthcare Appointments API

A NestJS-based API for managing healthcare appointments with CSV bulk import capabilities using Bull Queue for background processing.

## Features

- Patient management (CRUD operations)
- Appointment scheduling and management
- Bulk appointment import via CSV files
- Background job processing with Bull Queue (Redis)
- MongoDB for data persistence

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd challenge11
```

2. Install dependencies:
```bash
npm install
```

3. Start the required services (MongoDB and Redis):
```bash
docker compose -f docker-compose.dev.yml up -d
```

## Running the Application

### Development mode
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Patients
- `GET /patients` - List all patients (limited to 50)
- `GET /patients/:id` - Get a specific patient
- `POST /patients` - Create a new patient

### Appointments
- `GET /appointments` - List all appointments (limited to 50)
  - Query parameters: `patient_id`, `doctor`
- `GET /appointments/:id` - Get a specific appointment
- `POST /appointments` - Upload CSV file for bulk appointment creation
- `GET /appointments/queue/status` - Get queue processing status
- `GET /appointments/queue/job/:id` - Get specific job status

## CSV Import Format

The CSV file for bulk appointment import should have the following format:

```csv
patient_id,doctor,appointment_date,reason
1,Dr. Smith,2024-10-21T10:00:00Z,Annual check-up
2,Dr. Johnson,2024-10-22T14:30:00Z,Consultation
```

### Testing CSV Import


1. Upload sample CSV file:
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{"filepath": "scripts/test-appointments-100.csv"}'
```
OR 

2. Use the script to for concurrent uploads:
```bash
./scripts/test-concurrent-uploads.sh
```

## Monitoring

### Queue Monitoring Script
Monitor the Redis queue in real-time:
```bash
./scripts/monitor-queue.sh
```

## Scripts

The `scripts/` directory contains helpful utilities:

- `monitor-queue.sh` - Real-time queue monitoring
- `seed-patients.sh` - Seed the database with sample patients
- `test-concurrent-uploads.sh` - Test concurrent CSV uploads
- Sample CSV files for testing

## Environment Variables

The application uses the following environment variables (with defaults):

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://localhost:27017/healthcare`)
- `REDIS_HOST` - Redis host (default: `localhost`)
- `REDIS_PORT` - Redis port (default: `6379`)

## Troubleshooting

### Port conflicts
If you encounter port conflicts (especially with Redis on port 6379):

1. Check if a local Redis instance is running:
```bash
ps aux | grep redis
```

2. Either stop the local Redis:
```bash
sudo systemctl stop redis
```

3. Or modify the port in `docker-compose.dev.yml` to use a different port.

### Container issues
If containers are not running:
```bash
# Check container status
docker ps -a

# View container logs
docker logs healthcare-redis
docker logs healthcare-mongodb

# Restart containers
docker compose -f docker-compose.dev.yml restart
```
