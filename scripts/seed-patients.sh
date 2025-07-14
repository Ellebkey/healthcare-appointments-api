#!/bin/bash

echo "Seeding patients..."

# Array of patients
patients=(
  '{"name":"John Doe","age":30,"gender":"Male","contact":"555-0001"}'
  '{"name":"Jane Smith","age":28,"gender":"Female","contact":"555-0002"}'
  '{"name":"Robert Johnson","age":45,"gender":"Male","contact":"555-0003"}'
  '{"name":"Maria Garcia","age":33,"gender":"Female","contact":"555-0004"}'
  '{"name":"Michael Brown","age":52,"gender":"Male","contact":"555-0005"}'
  '{"name":"Sarah Davis","age":41,"gender":"Female","contact":"555-0006"}'
  '{"name":"David Wilson","age":37,"gender":"Male","contact":"555-0007"}'
  '{"name":"Lisa Martinez","age":29,"gender":"Female","contact":"555-0008"}'
  '{"name":"James Anderson","age":55,"gender":"Male","contact":"555-0009"}'
  '{"name":"Patricia Taylor","age":38,"gender":"Female","contact":"555-0010"}'
  '{"name":"Christopher Lee","age":42,"gender":"Male","contact":"555-0011"}'
  '{"name":"Jennifer White","age":31,"gender":"Female","contact":"555-0012"}'
  '{"name":"Daniel Harris","age":48,"gender":"Male","contact":"555-0013"}'
  '{"name":"Karen Clark","age":36,"gender":"Female","contact":"555-0014"}'
  '{"name":"Thomas Lewis","age":50,"gender":"Male","contact":"555-0015"}'
  '{"name":"Nancy Walker","age":44,"gender":"Female","contact":"555-0016"}'
  '{"name":"Paul Hall","age":39,"gender":"Male","contact":"555-0017"}'
  '{"name":"Betty Allen","age":47,"gender":"Female","contact":"555-0018"}'
  '{"name":"Mark Young","age":34,"gender":"Male","contact":"555-0019"}'
  '{"name":"Dorothy King","age":43,"gender":"Female","contact":"555-0020"}'
)

# Create each patient
for patient in "${patients[@]}"; do
  echo "Creating patient: $patient"
  curl -X POST http://localhost:3000/patients \
    -H "Content-Type: application/json" \
    -d "$patient" \
    -s | jq '.'
  sleep 0.1
done

echo "Done! Created 20 patients."