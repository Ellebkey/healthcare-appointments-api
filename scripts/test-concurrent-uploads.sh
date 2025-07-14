#!/bin/bash

echo "Starting concurrent CSV uploads..."
echo ""

# Function to upload CSV and display result
upload_csv() {
    local filepath=$1
    local label=$2
    echo "[$label] Uploading $filepath..."

    response=$(curl -s -X POST http://localhost:3000/appointments \
        -H "Content-Type: application/json" \
        -d "{\"filepath\": \"$filepath\"}")

    echo "[$label] Response: $response"
}

# Run three uploads concurrently
upload_csv "test-appointments-100.csv" "Small CSV" &
upload_csv "test-appointments-1000.csv" "1K CSV" &
upload_csv "test-appointments-10000.csv" "10K CSV" &

# Wait for all background jobs to complete
wait

echo ""
echo "All uploads completed!"
echo ""
echo "Checking queue status..."
curl -s http://localhost:3000/appointments/queue/status | jq '.'
