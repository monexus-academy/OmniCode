$ErrorActionPreference = "Stop"

$expectedName = "monexus-academy"
$expectedEmail = "support@monexus.com"
$expectedGitHubAlias = "github-monexus"

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=== $Title ==="
}

function Write-Status {
    param(
        [string]$Label,
        [string]$Value,
        [bool]$Ok = $true
    )

    $prefix = if ($Ok) { "[ok]" } else { "[warn]" }
    Write-Host ("{0} {1}: {2}" -f $prefix, $Label, $Value)
}

Write-Section "Git"

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    throw "This folder is not inside a Git repository."
}

$localName = git config --local --get user.name 2>$null
$localEmail = git config --local --get user.email 2>$null
$branch = git branch --show-current 2>$null
$remotes = git remote -v 2>$null
$remoteUsesExpectedAlias = $false
if ($remotes) {
    $remoteUsesExpectedAlias = (($remotes | Select-String -SimpleMatch $expectedGitHubAlias) -ne $null)
}

Write-Status "Repo root" $repoRoot
Write-Status "Branch" ($(if ($branch) { $branch } else { "(no commits yet)" }))
Write-Status "Local user.name" ($(if ($localName) { $localName } else { "(missing)" })) ($localName -eq $expectedName)
Write-Status "Local user.email" ($(if ($localEmail) { $localEmail } else { "(missing)" })) ($localEmail -eq $expectedEmail)
Write-Status "Remotes" ($(if ($remotes) { ($remotes -join "; ") } else { "(no remotes configured)" })) $remoteUsesExpectedAlias

Write-Section "SSH"

$sshConfigPath = Join-Path $HOME ".ssh\config"
if (Test-Path $sshConfigPath) {
    $sshConfig = Get-Content $sshConfigPath -Raw
    $hasAlias = $sshConfig -match "(?m)^Host\s+$expectedGitHubAlias\s*$"
    Write-Status "SSH config" $sshConfigPath $true
    Write-Status "GitHub alias" $expectedGitHubAlias $hasAlias
} else {
    Write-Status "SSH config" "(missing: $sshConfigPath)" $false
    Write-Status "GitHub alias" $expectedGitHubAlias $false
}

Write-Section "GitHub CLI"

$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCommand) {
    Write-Status "gh" $ghCommand.Source
    gh auth status
} else {
    Write-Status "gh" "(not installed or not on PATH)" $false
}

Write-Section "Vercel CLI"

$vercelCommand = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelCommand) {
    Write-Status "vercel" $vercelCommand.Source
    vercel whoami
} else {
    Write-Status "vercel" "(not installed or not on PATH)" $false
}

Write-Section "Vercel Link"

$vercelProjectPath = Join-Path $repoRoot ".vercel\project.json"
if (Test-Path $vercelProjectPath) {
    Write-Status ".vercel/project.json" $vercelProjectPath
    Get-Content $vercelProjectPath
} else {
    Write-Status ".vercel/project.json" "(missing)" $false
}
