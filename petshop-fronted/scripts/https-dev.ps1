$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$certDir = Join-Path $root 'certs'
New-Item -ItemType Directory -Force -Path $certDir | Out-Null
$ip = '192.168.1.116'
$cert = Join-Path $certDir 'petshop-localhost.pfx'
$cer = Join-Path $certDir 'petshop-localhost.cer'

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
  Write-Host 'ไม่พบ mkcert ในเครื่องนี้' -ForegroundColor Yellow
  Write-Host 'ติดตั้ง mkcert ก่อน แล้วรันไฟล์นี้อีกครั้ง' -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $cert)) {
  & mkcert -install
  & mkcert -pkcs12 -p12-file $cert 'localhost' '127.0.0.1' $ip
  & mkcert -cert-file (Join-Path $certDir 'petshop-localhost.crt') -key-file (Join-Path $certDir 'petshop-localhost-key.pem') 'localhost' '127.0.0.1' $ip
  Write-Host "สร้าง certificate แล้ว: $cert" -ForegroundColor Green
}

Write-Host ''
Write-Host 'HTTPS dev certificate พร้อมสำหรับ:' -ForegroundColor Green
Write-Host "https://$ip`:5173"
Write-Host "WSS: wss://$ip`:5174"
Write-Host ''
Write-Host 'หมายเหตุ: ต้องติดตั้ง root CA ของ mkcert บนโทรศัพท์เพื่อให้มือถือเชื่อถือ HTTPS' -ForegroundColor Cyan
