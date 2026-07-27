#!/bin/bash
# Deploy script for Debt Tracker (Thu Nợ Khác)
# Server IP: 171.254.92.12

echo "Starting Deployment for Debt Tracker..."

# Lấy code mới nhất (nếu dùng git, bỏ comment dòng dưới)
# git pull origin main

# Build và khởi chạy các container
docker-compose up --build -d

echo "Deployment completed!"
echo "Các container đang chạy:"
docker ps --filter "name=debttracker_"

echo "Lưu ý:"
echo "- Frontend: port 8004"
echo "- Backend: port 8082"
echo "- Database: port 3309"
echo "Kiểm tra logs nếu có lỗi: docker-compose logs -f"
