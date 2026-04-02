# Quick API Test for AI Chat (No Auth Required)

$SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
$API_ENDPOINT = "$SUPABASE_URL/functions/v1/make-server-21d26442/ai/chat"

Write-Host "Testing AI Chat API..." -ForegroundColor Cyan
Write-Host "Endpoint: $API_ENDPOINT" -ForegroundColor Yellow
Write-Host ""

try {
    $payload = @{
        message = "I have a fever, what should I do?"
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri $API_ENDPOINT `
        -Method Post `
        -Headers @{"Content-Type" = "application/json"} `
        -Body $payload

    Write-Host "✓ Success!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.response
    Write-Host ""
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Replace YOUR_PROJECT_ID with your actual Supabase project ID" -ForegroundColor Yellow
    Write-Host "2. Check if the API endpoint is correct" -ForegroundColor Yellow
    Write-Host "3. Ensure your development server is running" -ForegroundColor Yellow
}
