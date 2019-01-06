#!/bin/bash

set -e

scriptname=$(basename $0)
pidfile="/var/run/${scriptname}"

exec 200>$pidfile
flock -n 200 || exit 1
pid=$$
echo $pid 1>&200

if [ $# -eq 0 ]
  then
    echo "Argument for API key not provided"
    exit 2
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
  exit 3
fi;
