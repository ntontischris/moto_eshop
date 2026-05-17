# Bake Hero B — Architecture B for /preview/hero-b
# Takes /public/hero-variants/cinematic-hero.mp4 (15s, 24fps, 4K) and bakes
# all motion-graphics text overlays + vignette into a single 1080p MP4.
#
# Usage: pwsh -File scripts/bake-hero-b.ps1
# Re-run any time text strings change in scripts/bake-hero-b/text-*.txt

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$src  = "public/hero-variants/cinematic-hero.mp4"
$out1080 = "public/hero-variants/cinematic-hero-baked.mp4"
$out720  = "public/hero-variants/cinematic-hero-baked-720p.mp4"
# Use forward-slash, relative paths in filter graph so ffmpeg's parser is happy.
$txtDir  = "scripts/bake-hero-b"

# Greek-capable font (verified visually). Forward slashes + escaped colon for ffmpeg filter parser.
$font = "C\:/Windows/Fonts/segoeuib.ttf"

# Helper to build a fade-in/out alpha expression. fade in 0.5s, hold, fade out last 0.5s.
function FadeAlpha($start, $end) {
    $fadeIn = $start + 0.5
    $fadeOut = $end - 0.5
    return "if(lt(t,$start),0,if(lt(t,$fadeIn),(t-$start)/0.5,if(lt(t,$fadeOut),1,if(lt(t,$end),($end-t)/0.5,0))))"
}

# Build the filter graph. The video is downscaled to 1080p first, then:
#  - vignette + light black side-fades (left/right gradient overlay)
#  - 5 beats of text overlays (eyebrow + title + body), each 3s with fade.

$beats = @()

# Positioning notes:
#  - Center beats use (w-text_w)/2 to be perfectly centered on the canvas.
#  - Left beats anchor at x = w*0.06 (~115px on 1920w).
#  - Right beats anchor at x = w - text_w - w*0.06 so text never clips the right edge.
#  - Title is the longest line — eyebrow/body are anchored to align with the title block on right beats.

# --- Beat 1 (0-3s) CENTER — "Ride." (white) + "Protected." (red), side by side, centered as a block ---
# At 120px Segoe UI Bold, "Ride." ≈ 340px wide, "Protected." ≈ 720px wide (measured visually).
# Block total ≈ 1080px. Center block: leftPad = (w - 1080)/2 = (w/2) - 540.
# "Ride." at x = (w/2) - 540, "Protected." at x = (w/2) - 540 + 360 (340 + 20 gap).
$a1 = FadeAlpha 0.0 3.0
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-1-eyebrow.txt':fontcolor=0xDC2626:fontsize=32:x=(w-text_w)/2:y=h*0.40:alpha='$a1'"
$beats += "drawtext=fontfile='$font':text='Ride.':fontcolor=white:fontsize=120:x=(w/2)-540:y=h*0.45:alpha='$a1'"
$beats += "drawtext=fontfile='$font':text='Protected.':fontcolor=0xDC2626:fontsize=120:x=(w/2)-180:y=h*0.45:alpha='$a1'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-1-body.txt':fontcolor=0xE5E5E5:fontsize=34:x=(w-text_w)/2:y=h*0.63:alpha='$a1'"

# --- Beat 2 (3-6s) RIGHT ---
$a2 = FadeAlpha 3.0 6.0
$rx = "(w-text_w-w*0.06)"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-2-eyebrow.txt':fontcolor=0xDC2626:fontsize=32:x=${rx}:y=h*0.40:alpha='$a2'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-2-title.txt':fontcolor=white:fontsize=88:x=${rx}:y=h*0.45:alpha='$a2'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-2-body.txt':fontcolor=0xE5E5E5:fontsize=30:x=${rx}:y=h*0.60:alpha='$a2'"

# --- Beat 3 (6-9s) LEFT ---
$a3 = FadeAlpha 6.0 9.0
$lx = "(w*0.06)"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-3-eyebrow.txt':fontcolor=0xDC2626:fontsize=32:x=${lx}:y=h*0.40:alpha='$a3'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-3-title.txt':fontcolor=white:fontsize=88:x=${lx}:y=h*0.45:alpha='$a3'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-3-body.txt':fontcolor=0xE5E5E5:fontsize=30:x=${lx}:y=h*0.60:alpha='$a3'"

# --- Beat 4 (9-12s) RIGHT ---
$a4 = FadeAlpha 9.0 12.0
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-4-eyebrow.txt':fontcolor=0xDC2626:fontsize=32:x=${rx}:y=h*0.40:alpha='$a4'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-4-title.txt':fontcolor=white:fontsize=72:x=${rx}:y=h*0.45:alpha='$a4'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-4-body.txt':fontcolor=0xE5E5E5:fontsize=30:x=${rx}:y=h*0.60:alpha='$a4'"

# --- Beat 5 (12-15s) LEFT ---
$a5 = FadeAlpha 12.0 15.0
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-5-eyebrow.txt':fontcolor=0xDC2626:fontsize=32:x=${lx}:y=h*0.40:alpha='$a5'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-5-title.txt':fontcolor=white:fontsize=88:x=${lx}:y=h*0.45:alpha='$a5'"
$beats += "drawtext=fontfile='$font':textfile='$txtDir/text-5-body.txt':fontcolor=0xE5E5E5:fontsize=30:x=${lx}:y=h*0.60:alpha='$a5'"

# Pre-filters: scale to 1080p, then darken edges (vignette) and bottom fade for legibility.
$pre = "scale=1920:-2:flags=lanczos,vignette=PI/4"

# Bottom-half darken gradient via geq is heavy; use a simple drawbox with low alpha on top/bottom thirds for cinematic letterbox feel.
$letterbox = "drawbox=x=0:y=0:w=iw:h=ih*0.18:color=black@0.55:t=fill,drawbox=x=0:y=ih*0.82:w=iw:h=ih*0.18:color=black@0.55:t=fill"

$filter = ($pre, $letterbox, ($beats -join ",")) -join ","

Write-Host "[bake-hero-b] Encoding 1080p (target <= 6MB)..."
& ffmpeg -y -i $src -vf $filter `
    -c:v libx264 -preset slow -crf 27 -profile:v main -level 4.0 `
    -pix_fmt yuv420p -movflags +faststart -an `
    $out1080

if (!(Test-Path $out1080)) { throw "1080p output missing" }
$size1080 = (Get-Item $out1080).Length / 1MB
Write-Host ("[bake-hero-b] 1080p size: {0:N2} MB" -f $size1080)
Write-Host ("[bake-hero-b] 1080p done: {0:N2} MB" -f $size1080)

Write-Host "[bake-hero-b] Encoding 720p (target <= 3MB)..."
$filter720 = $filter -replace "scale=1920:-2", "scale=1280:-2"
& ffmpeg -y -i $src -vf $filter720 `
    -c:v libx264 -preset slow -crf 28 -profile:v main -level 4.0 `
    -pix_fmt yuv420p -movflags +faststart -an `
    $out720

$size720 = (Get-Item $out720).Length / 1MB
Write-Host ("[bake-hero-b] 720p done: {0:N2} MB" -f $size720)

# Verify Greek at t=5s
Write-Host "[bake-hero-b] Extracting verification frame at t=5s..."
$verifyPath = Join-Path $txtDir "verify-5s.png"
& ffmpeg -y -ss 5 -i $out1080 -frames:v 1 -update 1 $verifyPath

Write-Host "[bake-hero-b] Done."
