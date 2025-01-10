#!/usr/bin/env bash

VERSION=$1
if [[ -z "$VERSION" ]]; then
  echo Error: please pass version
  echo
  echo Usage: $0 VERSION
  exit 1
fi

# Get release asset json
RELEASES_URL=https://api.github.com/repos/sourcery-ai/sourcery/releases
ASSETS=$( curl -s $RELEASES_URL | jq ".[] | select(.tag_name == \"v$VERSION\") | .assets" )
if [[ -z $ASSETS ]]; then
  echo Could not find version $VERSION in $RELEASES_URL
  exit 1
fi

# This is where we will build the package from
mkdir -p sourcery_binaries/install/{linux,mac,win}
rm -rf sourcery_binaries/install/{linux,mac,win}/*

# Download the binaries into here
mkdir -p downloaded_binaries/{linux,mac-arm64,mac-x64,win}
rm -rf downloaded_binaries/{linux,mac-arm64,mac-x64,win}/*


echo Downloading linux binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-linux.tar.gz\") | .browser_download_url" ) \
  | tar -xz -C downloaded_binaries/linux-x64

echo Downloading mac intel binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-mac-x64.tar.gz\") | .browser_download_url" ) \
  | tar -xz -C downloaded_binaries/mac-x64

echo Downloading mac arm64 binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-mac-arm64.tar.gz\") | .browser_download_url" ) \
  | tar -xz -C downloaded_binaries/mac-arm64

echo Downloading windows binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-win.zip\") | .browser_download_url" ) -o temp.zip
unzip temp.zip -d downloaded_binaries/win-x64/
rm temp.zip
