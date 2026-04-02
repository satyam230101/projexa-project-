# Doctor Patient Reports Endpoint Test
# Usage (PowerShell):
#   $env:API_BASE_URL = "http://127.0.0.1:8000"
#   $env:DOCTOR_JWT = "<doctor_access_token>"
#   $env:PATIENT_ID = "<patient_user_id>"
#   .\test-doctor-reports-endpoint.ps1

$API_BASE_URL = if ($env:API_BASE_URL) { $env:API_BASE_URL } else { "http://127.0.0.1:8000" }
$DOCTOR_JWT = $env:DOCTOR_JWT
$PATIENT_ID = $env:PATIENT_ID

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Doctor Reports Endpoint Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Base: $API_BASE_URL" -ForegroundColor Gray

if (-not $DOCTOR_JWT) {
    Write-Host "Missing DOCTOR_JWT environment variable." -ForegroundColor Red
    Write-Host "Set it with: `$env:DOCTOR_JWT = '<token>'" -ForegroundColor Yellow
    exit 1
}

if (-not $PATIENT_ID) {
    Write-Host "Missing PATIENT_ID environment variable." -ForegroundColor Red
    Write-Host "Set it with: `$env:PATIENT_ID = '<patient_user_id>'" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $DOCTOR_JWT"
    "Content-Type" = "application/json"
}

$patientReportsUrl = "$API_BASE_URL/api/reports/patient/$PATIENT_ID"

Write-Host "" 
Write-Host "1) GET /api/reports/patient/{patient_id}" -ForegroundColor Yellow
Write-Host "   URL: $patientReportsUrl" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $patientReportsUrl -Method Get -Headers $headers

    $count = if ($response.reports) { $response.reports.Count } else { 0 }
    Write-Host "   Success. Reports returned: $count" -ForegroundColor Green

    if ($count -gt 0) {
        $first = $response.reports[0]
        Write-Host "   First report:" -ForegroundColor Green
        Write-Host "   - id: $($first.id)" -ForegroundColor Gray
        Write-Host "   - fileName: $($first.fileName)" -ForegroundColor Gray
        Write-Host "   - status: $($first.status)" -ForegroundColor Gray
        Write-Host "   - uploadedAt: $($first.uploadedAt)" -ForegroundColor Gray
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "   Request failed with status: $statusCode" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Done" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
