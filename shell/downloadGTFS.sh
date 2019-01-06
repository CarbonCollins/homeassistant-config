#!/bin/bash

if [ $# -eq 0 ]
  then
    echo "Argument for API key not provided"
    exit 1
fi

# set cwd to the script location
cd "${0%/*}"

# download skåne GTFS zip
mkdir -p "../gtfs"
if curl --fail -o "../gtfs/skane.zip.tmp" "https://gtfs-pp.samtrafiken.se/skane/skane.zip?key=$1"; then
  rm "../gtfs/skane.zip"
  mv "../gtfs/skane.zip.tmp" "../gtfs/skane.zip"
  exit 0
else
  echo "Failed to download skåne GTFS zip"
  exit 1
fi;
