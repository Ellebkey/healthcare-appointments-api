#!/bin/bash

echo "=== Bull Queue Monitor ==="
echo "Monitoring Redis queue for appointments..."
echo ""

# Check if Redis container is running
if ! docker ps | grep -q healthcare-redis; then
    echo "Error: healthcare-redis container is not running!"
    echo "Please start it with: docker compose -f docker-compose.dev.yml up -d"
    exit 1
fi

# Monitor Redis keys in real-time
watch -n 1 'echo "=== Queue Status ===" && \
docker exec healthcare-redis redis-cli keys "bull:appointments:*" | head -20 && \
echo "" && \
echo "=== Queue Counts ===" && \
echo -n "Waiting: " && docker exec healthcare-redis redis-cli llen bull:appointments:wait 2>/dev/null || echo "0" && \
echo -n "Active: " && docker exec healthcare-redis redis-cli llen bull:appointments:active 2>/dev/null || echo "0" && \
echo -n "Completed: " && docker exec healthcare-redis redis-cli zcard bull:appointments:completed 2>/dev/null || echo "0" && \
echo -n "Failed: " && docker exec healthcare-redis redis-cli zcard bull:appointments:failed 2>/dev/null || echo "0" && \
echo "" && \
echo "=== Recent Jobs ===" && \
docker exec healthcare-redis redis-cli zrange bull:appointments:completed -5 -1'