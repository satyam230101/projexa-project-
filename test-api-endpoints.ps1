# API Test Script - Health Reports & AI Chat
# Project ID: imsdbgjyvetadbgjpxse

$SUPABASE_URL = "https://imsdbgjyvetadbgjpxse.supabase.co"
$API_BASE = "$SUPABASE_URL/functions/v1/make-server-21d26442"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Medi+ API Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Base: $API_BASE" -ForegroundColor Gray
Write-Host ""

# Test 1: Health Check
Write-Host "1. Health Check" -ForegroundColor Yellow
Write-Host "   URI: GET /health" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get
    Write-Host "   ✓ Status: $($response.status)" -ForegroundColor Green
    Write-Host "   ✓ Service: $($response.service)" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: AI Chat (No Auth Required)
Write-Host "2. AI Chat Endpoint" -ForegroundColor Yellow
Write-Host "   URI: POST /ai/chat" -ForegroundColor Gray
Write-Host "   Message: 'I have a fever'" -ForegroundColor Gray
try {
    $payload = @{
        message = "I have a fever"
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "$API_BASE/ai/chat" `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $payload

    Write-Host "   ✓ Response received" -ForegroundColor Green
    Write-Host "   Response preview: $($response.response.Substring(0, 80))..." -ForegroundColor Green
}
catch {
    Write-Host "   ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For authenticated endpoints (health reports):" -ForegroundColor Yellow
Write-Host "1. Login in the app at http://localhost:5173/" -ForegroundColor Yellow
Write-Host "2. Get auth token from browser localStorage" -ForegroundColor Yellow
Write-Host "3. Use the test-api-authenticated.ps1 script" -ForegroundColor Yellow
