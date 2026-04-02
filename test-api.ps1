# API Testing Script for Health Reports and AI Chat

$API_BASE = "https://YOUR_PROJECT_ID.supabase.co/functions/v1/make-server-21d26442"
$AUTH_TOKEN = "YOUR_BEARER_TOKEN_HERE"  # Get from browser console after login

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "API Testing - Health Reports & AI Chat" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing API Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/health" -Method Get
    Write-Host "✓ Health Check: $($response.status)" -ForegroundColor Green
    Write-Host "  Service: $($response.service)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Health Check Failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 2: AI Chat Endpoint (No Auth Required)
Write-Host "2. Testing AI Chat Endpoint..." -ForegroundColor Yellow
try {
    $chatPayload = @{
        message = "I have a fever"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_BASE/ai/chat" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AUTH_TOKEN"
        } `
        -Body $chatPayload
    
    Write-Host "✓ AI Chat Response Received" -ForegroundColor Green
    Write-Host "  Response: $($response.response.Substring(0, 100))..." -ForegroundColor Green
}
catch {
    Write-Host "✗ AI Chat Failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Health Reports Upload (Requires Auth)
Write-Host "3. Testing Health Reports Upload..." -ForegroundColor Yellow
try {
    $reportPayload = @{
        fileName = "test-report.pdf"
        fileType = "application/pdf"
        fileSize = 1024
        category = "Blood Test"
        notes = "Test upload from PowerShell"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$API_BASE/health-reports" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AUTH_TOKEN"
        } `
        -Body $reportPayload
    
    Write-Host "✓ Health Report Upload Success" -ForegroundColor Green
    Write-Host "  Report ID: $($response.report.id)" -ForegroundColor Green
    Write-Host "  Status: $($response.report.status)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Health Report Upload Failed: $_" -ForegroundColor Red
    Write-Host "  Note: Make sure AUTH_TOKEN is set correctly" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
