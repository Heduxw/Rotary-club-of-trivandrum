$port = 8123
$root = "C:\Users\sreej\OneDrive\Documents\Rotary website\Rotary-club-of-trivandrum"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"
while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.LocalPath).TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
    $full = Join-Path $root $path
    if ((Test-Path $full) -and ((Get-Item $full) -is [System.IO.DirectoryInfo])) {
        $full = Join-Path $full "index.html"
    }
    if (Test-Path $full) {
        try {
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $ext = [System.IO.Path]::GetExtension($full).ToLower()
            switch ($ext) {
                ".html" { $ct = "text/html; charset=utf-8" }
                ".css"  { $ct = "text/css" }
                ".js"   { $ct = "application/javascript" }
                ".svg"  { $ct = "image/svg+xml" }
                ".png"  { $ct = "image/png" }
                ".jpg"  { $ct = "image/jpeg" }
                ".jpeg" { $ct = "image/jpeg" }
                default { $ct = "application/octet-stream" }
            }
            $ctx.Response.ContentType = $ct
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $ctx.Response.StatusCode = 500
        }
    } else {
        $ctx.Response.StatusCode = 404
    }
    $ctx.Response.Close()
}
