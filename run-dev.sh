#!/bin/bash

# Start backend dev
cd ./backend && npm run dev &

# Start frontend dev
cd ./frontend && npm run dev &

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?