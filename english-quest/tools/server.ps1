# English Quest - may chu cuc bo sieu nho (khong can cai dat gi them)
# Chay: bam dup file "Chay-game.bat" o thu muc goc cua game.
param([int]$Port = 8765)

$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
if (-not $root.EndsWith('\')) { $root = $root + '\' }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
  $listener.Start()
} catch {
  Write-Host "Cong $Port dang duoc dung (co the game da mo san). Dang mo trinh duyet..."
  Start-Process "http://localhost:$Port/index.html"
  exit
}

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'application/javascript; charset=utf-8';
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json; charset=utf-8';
  '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon';
  '.md' = 'text/plain; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.mp3' = 'audio/mpeg'; '.ogg' = 'audio/ogg'
}

Write-Host "=============================================="
Write-Host "  ENGLISH QUEST dang chay tai:"
Write-Host "  http://localhost:$Port/index.html"
Write-Host "  GIU cua so nay mo trong luc choi."
Write-Host "  Dong cua so nay de tat game."
Write-Host "=============================================="
Start-Process "http://localhost:$Port/index.html"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
    if ([string]::IsNullOrEmpty($rel)) { $rel = 'index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $rel))
    if (-not $file.StartsWith($root) -or -not (Test-Path -LiteralPath $file -PathType Leaf)) {
      $ctx.Response.StatusCode = 404
      $ctx.Response.Close()
      continue
    }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] } else { $ctx.Response.ContentType = 'application/octet-stream' }
    $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    $ctx.Response.Close()
  } catch {
    Write-Host "Loi nho: $($_.Exception.Message)"
  }
}
