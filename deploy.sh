#!/bin/bash
set -e # Exit on any error
echo "Building Docker image..."
docker build -t kts-vlt .
echo "Tagging image..."
docker tag kts-vlt kliemt.azurecr.io/kts-vlt
echo "Pushing to Kliemt Azure Container Registry..."
docker push kliemt.azurecr.io/kts-vlt
echo "Restarting deployment kts-vlt..."
kubectl rollout restart deployment kts-vlt
echo "Waiting for rollout to complete..."
kubectl rollout status deployment kts-vlt --timeout=120s
echo "Deployment restarted successfully!"