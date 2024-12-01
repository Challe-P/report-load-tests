#!/bin/bash

wait_for_container_to_stop() {
  local container=$1
  echo "Waiting for containern $container to stop..."
  while docker ps | grep -q "$container"; do
    sleep 1
  done
}

wait_for_container_to_start() {
  local container=$1
  echo "Waiting for containern $container to start..."
  until docker ps | grep -q "$container"; do
    sleep 1
  done
}

export SERVER="fastapi"
docker compose up -d fastapi
wait_for_container_to_start fastapi-server
sleep 5
k6 run -d 60s -u 40 ./load-test-script-html-summary.js
docker compose down fastapi
wait_for_container_to_stop fastapi

export SERVER="express"
docker compose up -d express
wait_for_container_to_start express-server
sleep 5
k6 run -d 60s -u 40 ./load-test-script-html-summary.js
docker compose down express
wait_for_container_to_stop express

export SERVER="laravel"
docker compose up -d laravel
wait_for_container_to_start laravel-server
sleep 5
k6 run -d 60s -u 40 ./load-test-script-html-summary.js
docker compose down laravel
wait_for_container_to_stop laravel
