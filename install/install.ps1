# Download the latest release
Invoke-RestMethod -Uri https://api.github.com/repos/Turtlepaw/clockwork/releases/latest |
ForEach-Object {
    $_.assets | Where-Object { $_.name -eq "clockwork-win.exe" } | ForEach-Object {
        Invoke-WebRequest -Uri $_.browser_download_url -OutFile "clockwork-win.exe"
    }
}

# Move the file to a directory in PATH
Move-Item -Path "clockwork-win.exe" -Destination "C:\Program Files\Clockwork\clockwork.exe"

# Add the directory to PATH
[System.Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Clockwork", [System.EnvironmentVariableTarget]::Machine)

# Verify installation
& "C:\Program Files\Clockwork\clockwork.exe" --version