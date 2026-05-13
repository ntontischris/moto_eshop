# Pulls all available data from Entersoft API into local JSON snapshots.
# Run from project root: powershell -File scripts/pull-entersoft-data.ps1

$ErrorActionPreference = "Stop"

$API_KEY = "78874555-d8b3-4119-bfb0-60c4ca6ee8b2,fb10bfa3-d9ab-4e28-95d9-d358e0d03f2a,01100128469"
$BASE_URL = "https://api.entersoft.gr/api/rpc/PublicQuery/ESWBCat"
$OUT_DIR = "data/entersoft-snapshot"
$PAGE_SIZE = 500

if (-not (Test-Path $OUT_DIR)) { New-Item -ItemType Directory -Path $OUT_DIR -Force | Out-Null }

function Invoke-EsPq {
  param([string]$Endpoint, [string]$Query, [int]$Page, [int]$Size)
  $headers = @{
    "X-ESAPIKEY-ECOMCONNECTOR" = $API_KEY
    "X-ESPQOptions" = "{`"WithCount`":true,`"Page`":$Page,`"PageSize`":$Size}"
  }
  # ASP.NET rejects raw '*' in URLs - URL-encode it
  $encodedQuery = $Query -replace '\*', '%2A'
  $url = "$BASE_URL/$Endpoint`?$encodedQuery"
  return Invoke-RestMethod -Uri $url -Headers $headers -Method GET -TimeoutSec 120
}

function Pull-All {
  param([string]$Endpoint, [string]$Query, [string]$OutFile)
  Write-Host ""
  Write-Host "==> Pulling $Endpoint ..." -ForegroundColor Cyan
  $allRows = @()
  $page = 1
  $total = $null
  while ($true) {
    Write-Host "    page $page (size $PAGE_SIZE)..." -NoNewline
    $resp = Invoke-EsPq -Endpoint $Endpoint -Query $Query -Page $page -Size $PAGE_SIZE
    if ($null -eq $total) { $total = $resp.Count }
    $allRows += $resp.Rows
    Write-Host " got $($resp.Rows.Count) (total so far $($allRows.Count) / $total)"
    if ($resp.Rows.Count -lt $PAGE_SIZE) { break }
    $page++
    Start-Sleep -Milliseconds 300  # be gentle on the API
  }
  $payload = @{
    table = $resp.Table
    count = $total
    rows = $allRows
    pulledAt = (Get-Date).ToString("o")
  }
  $json = $payload | ConvertTo-Json -Depth 10 -Compress
  $path = Join-Path $OUT_DIR $OutFile
  [System.IO.File]::WriteAllText((Resolve-Path $OUT_DIR).Path + "\$OutFile", $json, [System.Text.Encoding]::UTF8)
  Write-Host "    OK saved $($allRows.Count) rows -> $path" -ForegroundColor Green
}

Write-Host ""
Write-Host "Entersoft data pull starting..." -ForegroundColor Yellow
Write-Host "Output: $OUT_DIR" -ForegroundColor Yellow

# 1. ITEMS (3166 items)
Pull-All -Endpoint "ESPORTAL_CS_AppItems" `
  -Query "Code=*&ModifiedDateTimeFrom=2020-01-01&ModifiedDateTimeTo=2026-12-31&ItemGID=*&AssemblyType=*&MissingFields=*&ItemFamily_param=*&ItemGroup_param=*&ItemCategory_param=*&ItemSubcategory_param=*" `
  -OutFile "items.json"

# 2. PRICES (10308 rows)
Pull-All -Endpoint "ESPORTAL_CS_ItemPrices" `
  -Query "Code=*&ModifiedDateTimeFrom=2020-01-01&ModifiedDateTimeTo=2026-12-31&ItemGID=*" `
  -OutFile "prices.json"

# 3. STOCK (49378 rows)
Pull-All -Endpoint "ESPORTAL_CS_AppStockStatus" `
  -Query "Code=*&ItemGID=*&fStockDimCode=*&WHCode=*&Inactive=*" `
  -OutFile "stock.json"

# 4. CUSTOMERS (21093 rows)
Pull-All -Endpoint "ESPORTAL_CS_Customers" `
  -Query "LastModifiedDateFrom=2020-01-01&LastModifiedDateTo=2026-12-31&Code=*&TradeaccountGID=*&EMailAddress=*" `
  -OutFile "customers.json"

# 5. CUSTOMER SITES (72356 rows)
Pull-All -Endpoint "ESPORTAL_CS_AppCustomesSites" `
  -Query "TradeAccountCode=*&TradeAccountGID=*&LastModifiedDateFrom=2020-01-01&LastModifiedDateTo=2026-12-31" `
  -OutFile "customer-sites.json"

Write-Host ""
Write-Host "All done!" -ForegroundColor Green
Write-Host "Files in $OUT_DIR :" -ForegroundColor Yellow
Get-ChildItem $OUT_DIR | ForEach-Object { Write-Host "  $($_.Name) - $([Math]::Round($_.Length / 1KB, 1)) KB" }
