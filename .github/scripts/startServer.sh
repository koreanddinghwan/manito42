#! /bin/bash

echo "change directory"
cd /home/ubuntu

npx prisma generate
npx prisma migrate deploy

pm2
echo "Starting server..."
npm run start:prod