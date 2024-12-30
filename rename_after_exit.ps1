
            $Process = Get-Process -Name "build-win" -ErrorAction SilentlyContinue;
            If ($Process) {
              Write-Host "Waiting for build-win.exe to close...";
              Wait-Process -Name "build-win";
            }
              Get-ChildItem -Path "build-win.exe" | Remove-Item -Force;
            Rename-Item -Path "build-win.exe.tmp" -NewName "build-win.exe" -Force;
            # create works.txt file
            $file = "works.txt";
            $content = "Works!";
            Set-Content -Path $file -Value $content;
          