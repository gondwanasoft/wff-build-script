#!/bin/bash

# Download the latest release
curl -s https://api.github.com/repos/Turtlepaw/clockwork/releases/latest \
| grep "browser_download_url.*clockwork-linux" \
| cut -d : -f 2,3 \
| tr -d \" \
| wget -qi -

# Make the file executable
chmod +x clockwork-linux

# Move the file to /usr/local/bin
sudo mv clockwork-linux /usr/local/bin/clockwork

# Verify installation
clockwork --version