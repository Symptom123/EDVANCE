$files = Get-ChildItem -Path 'c:\Users\Symptom_black\Desktop\SMS\edusphere-react\src' -Recurse -File -Include *.jsx,*.css
foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $modified = $false
    if ($content -match 'Sphere') {
        $content = $content -replace 'Sphere', 'EDUVANCE'
        $modified = $true
    }
    if ($content -match 'sphereedu') {
        $content = $content -replace 'sphereedu', 'eduvance'
        $modified = $true
    }
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content
    }
}

$htmlFile = 'c:\Users\Symptom_black\Desktop\SMS\edusphere-react\index.html'
$htmlContent = Get-Content $htmlFile
$htmlContent = $htmlContent -replace 'edusphere-react', 'EDUVANCE'
$htmlContent = $htmlContent -replace 'Sphere', 'EDUVANCE'
Set-Content -Path $htmlFile -Value $htmlContent
