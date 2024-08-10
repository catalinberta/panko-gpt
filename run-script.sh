#!/bin/bash
export NODE_ENV=${NODE_ENV:-production}
if [ "$NODE_ENV" = "development" ];
then
	# Start backend dev
	cd ./backend && npm run dev &
	# Start frontend dev
	cd ./frontend && npm run dev &
elif [ "$NODE_ENV" = "production" ];
then
	# Build frontend
	cd ./frontend && npm run build
	# Build backend
	cd ../backend && npm run build
	node ./dist/index
fi

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?