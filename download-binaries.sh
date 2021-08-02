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

# Delete existing binaries
mkdir -p sourcery_binaries/install/{linux,mac,win}
rm -rf sourcery_binaries/install/{linux,mac,win}/*

echo Downloading linux binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-linux.tar.gz\") | .browser_download_url" ) \
  | tar -xz -C sourcery_binaries/install/linux

echo Downloading mac binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-mac.tar.gz\") | .browser_download_url" ) \
  | tar -xz -C sourcery_binaries/install/mac

echo Downloading windows binary
curl -s -L $( echo $ASSETS | jq -r ".[] | select(.name == \"sourcery-$VERSION-win.zip\") | .browser_download_url" ) -o temp.zip
unzip temp.zip -d sourcery_binaries/install/win/
rm temp.zip
