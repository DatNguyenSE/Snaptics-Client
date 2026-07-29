$bucketName = "snaptics-frontend-923988301802"
$region = "ap-southeast-1"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 BAT DAU DEPLOY SNAPCTICS-FRONTEND" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Build Angular
Write-Host "`n[1/3] Dang dich (Build) code Angular ra file HTML/JS/CSS..." -ForegroundColor Yellow
Set-Location -Path ".\client"
npm run build

# 2. Config S3
Write-Host "`n[2/3] Kiem tra kho luu tru S3..." -ForegroundColor Yellow
# Kiem tra bucket co chua
$bucketExists = aws s3 ls "s3://$bucketName" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Kho S3 chua co, dang tu dong tao moi..." -ForegroundColor White
    aws s3 mb "s3://$bucketName" --region $region
    
    Write-Host "Mo cua cho phep Public truy cap..." -ForegroundColor White
    aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
    
    Write-Host "Bat tinh nang Host Website..." -ForegroundColor White
    aws s3 website "s3://$bucketName" --index-document index.html --error-document index.html
    
    Write-Host "Them quyen doc file (Bucket Policy)..." -ForegroundColor White
    $policy = '{ "Version": "2012-10-17", "Statement": [ { "Sid": "PublicReadGetObject", "Effect": "Allow", "Principal": "*", "Action": "s3:GetObject", "Resource": "arn:aws:s3:::' + $bucketName + '/*" } ] }'
    $policyFile = "s3-policy.json"
    $policy | Out-File -FilePath $policyFile -Encoding ASCII
    aws s3api put-bucket-policy --bucket $bucketName --policy file://$policyFile
    Remove-Item $policyFile
}

# Angular uses client-side routing. Keep the S3 website fallback configured even
# when the bucket already exists; CloudFront must also forward 404s to index.html.
Write-Host "`nCau hinh SPA fallback cho Angular..." -ForegroundColor Yellow
aws s3 website "s3://$bucketName" --index-document index.html --error-document index.html

# 3. Sync to S3
Write-Host "`n[3/3] Dang day file tinh len AWS S3..." -ForegroundColor Yellow
$distPath = "dist\client\browser"
if (-Not (Test-Path $distPath)) {
    $distPath = "dist\client"
}
aws s3 sync $distPath "s3://$bucketName" --delete

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "🎉 DEPLOY FRONTEND THANH CONG!" -ForegroundColor Green
Write-Host "Link website cua ban la:" -ForegroundColor White
Write-Host "http://$bucketName.s3-website-$region.amazonaws.com" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Green
Set-Location -Path ".."
