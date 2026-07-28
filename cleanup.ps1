# ============================================================
#  Studio NEWO - full site folder cleanup
#  ------------------------------------------------------------
#  Deletes confirmed-dead / duplicate files, removes a stray test folder, and
#  renames the image folder to lowercase "materials" (GitHub Pages is
#  case-sensitive and the site code uses lowercase, so this is required for the
#  material images to show on the live site).
#
#  Everything deleted here is either unused by the site, a leftover duplicate,
#  or a doc that now lives in the docs/ folder. Your real content is untouched.
#
#  HOW TO RUN:
#   - Keep this file in the Website folder (it already is).
#   - Right-click it > "Run with PowerShell".
#     (If Windows blocks it, open PowerShell in the Website folder and run:
#        powershell -ExecutionPolicy Bypass -File .\cleanup.ps1 )
# ============================================================

$ErrorActionPreference = 'SilentlyContinue'
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

function Del($rel) {
  $p = Join-Path $root $rel
  if (Test-Path $p) { Remove-Item -LiteralPath $p -Recurse -Force; Write-Host "deleted  $rel" }
}

Write-Host "Cleaning up the Studio NEWO folder..."
Write-Host ""

# --- 1. dead logo marks (header marks are inline SVG in the HTML) ---
Del 'logo/logo.svg'
Del 'logo/hamburger.svg'
Del 'logo/wordmark.svg'

# --- 2. unused per-project 3D / mechanism files (only KART uses these) ---
foreach ($proj in 'omni','naf','neb','amsalp') {
  Del "projects/$proj/model.glb"
  Del "projects/$proj/mechanism.svg"
}
Del 'projects/naf/mechanism.html'
Del 'projects/omni/hero.jpg.test'

# --- 3. old background-video poster (unused now) ---
Del 'videos/sky-poster.jpg'

# --- 3b. stray zero-byte file left by a mistyped PowerShell redirect ---
Del '$null'

# --- 4. docs that now live in docs/, and the old materials-only script ---
Del 'HANDOFF.txt'
Del 'FILL_GUIDE.txt'
Del 'NEWO_Copy_Guide.txt'
Del 'NEWO_Copy_Guide.docx'
Del 'cleanup-materials.ps1'

# --- 5. materials/ leftovers: backups (*.jpg~) + superseded originals ---
$mat = Join-Path $root 'Materials'
if (-not (Test-Path $mat)) { $mat = Join-Path $root 'materials' }
if (Test-Path $mat) {
  Get-ChildItem -LiteralPath $mat -Filter '*.jpg~' | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Force; Write-Host ("deleted  materials/" + $_.Name)
  }
  $matJunk = @(
    'aluminum-polished.jpg','baltic.jpg','pine.jpg','leather.jpg',
    'cat-bio.jpeg','cat-glass.jpeg','cat-metal.jpeg','cat-plastic.jpeg','cat-soft.jpeg','cat-wood.jpeg',
    'glass-frosted.jpeg','pla.jpeg','petg.jpeg','foam.jpeg'
  )
  foreach ($f in $matJunk) {
    $p = Join-Path $mat $f
    if (Test-Path $p) { Remove-Item -LiteralPath $p -Force; Write-Host "deleted  materials/$f" }
  }
}

# --- 6. stray empty test folder ---
Del 'materials_test'

# --- 7. rename the image folder to lowercase 'materials' (two-step, because
#        Windows treats "Materials" and "materials" as the same name) ---
$cap = Join-Path $root 'Materials'
if (Test-Path $cap) {
  Rename-Item -LiteralPath $cap -NewName 'materials_tmp' -Force
  Rename-Item -LiteralPath (Join-Path $root 'materials_tmp') -NewName 'materials' -Force
  Write-Host "renamed  image folder to lowercase 'materials'"
}

# --- 8. if this is a git repo, stage everything so the rename/deletes commit ---
if (Test-Path (Join-Path $root '.git')) {
  Push-Location $root
  git add -A 2>$null | Out-Null
  Pop-Location
  Write-Host "staged   all changes in git (commit + push when ready)"
}

Write-Host ""
Write-Host "Cleanup complete. If the image folder still shows as 'Materials'"
Write-Host "(capital M) in GitHub after pushing, tell Claude and it will give"
Write-Host "you the one git command to fix the folder case."
