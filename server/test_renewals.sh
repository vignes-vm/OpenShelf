#!/bin/bash
# Test script for OpenShelf Renewal & Fine Management System

BASE_URL="http://localhost:5000"

echo "🧪 Testing OpenShelf Renewal & Fine Management System"
echo "================================================"

echo
echo "1. First, login as librarian:"
curl -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "librarian", "password": "librarian123", "role": "librarian"}' \
  -c cookies.txt

echo
echo
echo "2. Get all issued books (with due dates and overdue status):"
curl -X GET "$BASE_URL/api/admin/issued-books" \
  -H "Content-Type: application/json" \
  -b cookies.txt

echo
echo
echo "3. Get all overdue books:"
curl -X GET "$BASE_URL/api/admin/overdue-books" \
  -H "Content-Type: application/json" \
  -b cookies.txt

echo
echo
echo "4. Check renewal eligibility for transaction ID 1:"
curl -X GET "$BASE_URL/api/admin/renewal-check/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt

echo
echo
echo "5. Renew a book (replace 1 with actual transaction ID):"
curl -X POST "$BASE_URL/api/admin/renew" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": 1, "notes": "First renewal - student requested extension"}' \
  -b cookies.txt

echo
echo
echo "6. Calculate fine for an overdue book (replace 1 with actual transaction ID):"
curl -X POST "$BASE_URL/api/admin/calculate-fine" \
  -H "Content-Type: application/json" \
  -d '{"transactionId": 1}' \
  -b cookies.txt

echo
echo
echo "7. Check student fine history (replace CS2021001 with actual roll number):"
curl -X GET "$BASE_URL/api/admin/student-fines/CS2021001" \
  -H "Content-Type: application/json" \
  -b cookies.txt

echo
echo
echo "8. Collect fine payment (replace 1 with actual fine ID):"
curl -X POST "$BASE_URL/api/admin/collect-fine" \
  -H "Content-Type: application/json" \
  -d '{"fineId": 1, "paymentMethod": "cash", "notes": "Collected cash payment from student"}' \
  -b cookies.txt

echo
echo
echo "✅ Testing completed! Check the responses above for results."