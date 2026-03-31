#!/bin/bash
set -e

ENV=${1:-staging}

if [ "$ENV" != "staging" ] && [ "$ENV" != "production" ]; then
  echo "Usage: ./deploy.sh [staging|production]"
  exit 1
fi

IMAGE=kliemt.azurecr.io/kts-vlt
TAG=$ENV
GIT_SHA=$(git rev-parse --short HEAD)

echo "Building Docker image for $ENV..."
docker build --platform linux/amd64 -t $IMAGE:$TAG -t $IMAGE:$TAG-$GIT_SHA .

echo "Pushing to Kliemt Azure Container Registry..."
docker push $IMAGE:$TAG
docker push $IMAGE:$TAG-$GIT_SHA

if [ "$ENV" = "staging" ]; then
  CONTEXT="default"
else
  CONTEXT="kts-production"
fi

echo "Restarting deployment kts-vlt on $CONTEXT..."
kubectl --context $CONTEXT rollout restart deployment kts-vlt
echo "Waiting for rollout to complete..."
kubectl --context $CONTEXT rollout status deployment kts-vlt --timeout=120s
echo "Deployment to $ENV completed successfully!"