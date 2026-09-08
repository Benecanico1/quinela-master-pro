param (
    [switch]$BumpVersion,
    [string]$CustomVersionName = ""
)

$ErrorActionPreference = "Stop"
$AppRoot = "C:\Users\enero\.gemini\antigravity\scratch\quiniela-pro-app"
$FrontendDir = Join-Path $AppRoot "frontend"
$AndroidDir = Join-Path $FrontendDir "android"
$GradleFile = Join-Path $AndroidDir "app\build.gradle"
$UpdatesFolder = "C:\Users\enero\.gemini\antigravity\scratch\actualizaciones"

if (-not (Test-Path $UpdatesFolder)) {
    New-Item -ItemType Directory -Path $UpdatesFolder -Force | Out-Null
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO COMPILACION AUTOMATIZADA" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$gradleContent = Get-Content $GradleFile -Raw
$currentCode = [int]($gradleContent | Select-String 'versionCode\s+(\d+)' | ForEach-Object { $_.Matches[0].Groups[1].Value })
$currentName = ($gradleContent | Select-String 'versionName\s+"([^"]+)"' | ForEach-Object { $_.Matches[0].Groups[1].Value })

Write-Host "📌 Version actual: v$currentName (Build $currentCode)" -ForegroundColor Yellow

if ($BumpVersion) {
    $newCode = $currentCode + 1
    if ($CustomVersionName) {
        $newName = $CustomVersionName
    } else {
        $parts = $currentName.Split('.')
        if ($parts.Length -ge 3) {
            $parts[2] = [string]([int]$parts[2] + 1)
            $newName = $parts -join '.'
        } else {
            $newName = "$currentName.1"
        }
    }

    $gradleContent = $gradleContent -replace "versionCode\s+\d+", "versionCode $newCode"
    $gradleContent = $gradleContent -replace 'versionName\s+"[^"]+"', "versionName `"$newName`""
    Set-Content -Path $GradleFile -Value $gradleContent -Encoding UTF8
    Write-Host "✨ Version incrementada a: v$newName (Build $newCode)" -ForegroundColor Green
    $currentCode = $newCode
    $currentName = $newName
}

Write-Host "`n📦 [1/3] Compilando Frontend (Vite)..." -ForegroundColor Cyan
Set-Location $FrontendDir
npm run build

Write-Host "`n🔄 [2/3] Sincronizando Capacitor Android..." -ForegroundColor Cyan
npx cap sync android

Write-Host "`n⚙️ [3/3] Compilando AAB y APK Release con Java 17..." -ForegroundColor Cyan
Set-Location $AndroidDir
$env:JAVA_HOME = 'C:\Users\enero\.jdks\jbr-17.0.14'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
.\gradlew.bat bundleRelease assembleRelease

$apkSource = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release.apk"
$aabSource = Join-Path $AndroidDir "app\build\outputs\bundle\release\app-release.aab"

$apkDestName = "quiniela-master-pro-v$currentName-vc$currentCode-release.apk"
$aabDestName = "quiniela-master-pro-v$currentName-vc$currentCode-release.aab"

Copy-Item -Path $apkSource -Destination (Join-Path $UpdatesFolder $apkDestName) -Force
Copy-Item -Path $aabSource -Destination (Join-Path $UpdatesFolder $aabDestName) -Force

$localUpdates = Join-Path $AppRoot "actualizaciones"
if (-not (Test-Path $localUpdates)) { New-Item -ItemType Directory -Path $localUpdates -Force | Out-Null }
Copy-Item -Path $apkSource -Destination (Join-Path $localUpdates $apkDestName) -Force
Copy-Item -Path $aabSource -Destination (Join-Path $localUpdates $aabDestName) -Force

Write-Host "========================================================" -ForegroundColor Green
Write-Host "🎉 LISTO: Archivos guardados en carpeta actualizaciones" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
