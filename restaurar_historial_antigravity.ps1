# SCRIPT PARA IMPORTAR ESTA CONVERSACION EN OTRA COMPUTADORA# Ejecutar en PowerShell en la otra maquina desde la raiz del repositorio:

Test-Path -Path . | Out-Null
	$conversationId = 'f97b7984-4585-419a-88c9-e03855604772'
$userProfile = [System.Environment]::GetFolderPath('UserProfile')
$targetLogsDir = Join-Path $userProfile ".gemini/antigravity/brain/$conversationId/.system_generated/logs"

Write-Host "Creando directorio destino: $targetLogsDir" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $targetLogsDir | Out-Null

$sourceTranscript = "antigravity_session_backup/$conversationId/.system_generated/logs/transcript.jsonl"

if (Test-Path $sourceTranscript) {
    Copy-Item -Path $sourceTranscript -Destination (Join-Path $targetLogsDir 'transcript.jsonl') -Force
    Write-Host '[EXITO] transcript.jsonl restaurado correctamente en la otra PC.' -ForegroundColor Green
    Write-Host 'Abre Antigravity: ya veras todo el historial completo del chat.' -ForegroundColor Green
} else {
    Write-Host "[ERROR] No se encontro $sourceTranscript. Haz 'git pull' primero." -ForegroundColor Red
}
