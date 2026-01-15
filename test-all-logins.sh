#!/bin/bash

echo "=== COMPREHENSIVE LOGIN TESTS ==="
echo ""

# Test 1: Admin Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. ADMIN LOGIN TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: maggie@maggieforbesstrategies.com"
echo "Password: Success@2026!"
echo ""

ADMIN_RESULT=$(curl -s -X POST https://yourprivateestatechef.com/api/ypec/operations \
  -H "Content-Type: application/json" \
  -d '{"action":"admin_login","data":{"email":"maggie@maggieforbesstrategies.com","password":"U3VjY2Vzc0AyMDI2IQ==","encoded":true}}')

echo "$ADMIN_RESULT"
echo ""

if echo "$ADMIN_RESULT" | grep -q '"success":true'; then
  echo "✅ ADMIN LOGIN: SUCCESS"
  ADMIN_STATUS="✅ SUCCESS"
else
  echo "❌ ADMIN LOGIN: FAILED"
  ADMIN_STATUS="❌ FAILED"
fi

echo ""

# Test 2: Client Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. CLIENT LOGIN TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: test@client.com"
echo "Password: TestClient123"
echo ""

CLIENT_RESULT=$(curl -s -X POST https://yourprivateestatechef.com/api/ypec/operations \
  -H "Content-Type: application/json" \
  -d '{"action":"client_login","data":{"email":"test@client.com","password":"VGVzdENsaWVudDEyMw==","encoded":true}}')

echo "$CLIENT_RESULT"
echo ""

if echo "$CLIENT_RESULT" | grep -q '"success":true'; then
  echo "✅ CLIENT LOGIN: SUCCESS"
  CLIENT_STATUS="✅ SUCCESS"
else
  echo "❌ CLIENT LOGIN: FAILED"
  CLIENT_STATUS="❌ FAILED"
fi

echo ""

# Test 3: Chef Login
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. CHEF LOGIN TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Email: test@chef.com"
echo "Password: TestChef123"
echo ""

CHEF_RESULT=$(curl -s -X POST https://yourprivateestatechef.com/api/ypec/operations \
  -H "Content-Type: application/json" \
  -d '{"action":"chef_login","data":{"email":"test@chef.com","password":"VGVzdENoZWYxMjM=","encoded":true}}')

echo "$CHEF_RESULT"
echo ""

if echo "$CHEF_RESULT" | grep -q '"success":true'; then
  echo "✅ CHEF LOGIN: SUCCESS"
  CHEF_STATUS="✅ SUCCESS"
else
  echo "❌ CHEF LOGIN: FAILED"
  CHEF_STATUS="❌ FAILED"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Admin Portal:  $ADMIN_STATUS"
echo "Client Portal: $CLIENT_STATUS"
echo "Chef Portal:   $CHEF_STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
