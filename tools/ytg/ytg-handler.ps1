# Handler for ytg: links opened by the userscript's YouTube button.
# Registered by ytg-protocol.reg. Receives "ytg:<url-encoded link>", accepts
# only an http(s) link and runs ytg.exe with it as a single argument (no
# shell parsing, so the link cannot inject another command).
# Messages are plain ASCII: Windows PowerShell 5.1 reads BOM-less files as ANSI.
param([string]$Uri)

$ytg = 'D:\AgentWorks\yt-dlp-gui\release\ytg.exe'
$host.UI.RawUI.WindowTitle = 'ytg'

$link = [Uri]::UnescapeDataString(($Uri -replace '^ytg:(//)?', '')).TrimEnd('/')
if ($link -notmatch '^https?://[^\s"''<>|^]+$') {
  Write-Host "Link khong hop le: $link" -ForegroundColor Red
  Read-Host 'Enter de dong'
  exit 2
}
if (-not (Test-Path $ytg)) {
  Write-Host "Khong thay $ytg" -ForegroundColor Red
  Read-Host 'Enter de dong'
  exit 2
}

& $ytg $link
if ($LASTEXITCODE -ne 0) {
  Read-Host "ytg bao loi (ma $LASTEXITCODE). Enter de dong"
} else {
  Start-Sleep -Seconds 3
}
