# Self-healing script for Git index corruption on Windows
$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$indexPath = Join-Path $repoRoot ".git\index"

if (Test-Path $indexPath) {
    $item = Get-Item $indexPath
    if ($item.Length -lt 32) {
        Write-Host "[git-guard] Detected corrupted Git index ($($item.Length) bytes) at $indexPath" -ForegroundColor Red
        Remove-Item -Force $indexPath
        Push-Location $repoRoot
        git reset
        git update-index --index-version 4
        Pop-Location
        Write-Host "[git-guard] Git index has been successfully repaired." -ForegroundColor Green
    } else {
        Write-Host "[git-guard] Git index is healthy ($($item.Length) bytes)." -ForegroundColor Green
    }
}
