#!/bin/bash

set -e

scriptname=$(basename $0)
pidfile="/var/run/${scriptname}"

exec 200>$pidfile
flock -n 200 || exit 1
pid=$$
echo $pid 1>&200

# set cwd to the git location
cd "${0%/*}/.."

currentHash=$(git rev-parse HEAD)

# get latest changes
git reset --hard
git pull

# check config is valid and check its exit code
hass --script check_config -c .
if [ "$?" -eq "0" ]; then
  echo "config is valid. regenerating lovelace config"

  # update lovelace
  python3 ./lovelace-gen.py

  echo "done"
  exit 0
else
  echo "config is invalid. rolling config back"
  git reset --hard "$currentHash"

  exit 1
fi
