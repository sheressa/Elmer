#!/bin/bash

# Change these if you need to.
BOX_FOLDER="/vagrant/provision/files"
NVM_VERSION="v0.30.1"
NODE_VERSION="5.3.0"
NGINX_VERSION="1.9.9-1~trusty"

NVM_DIR="$HOME/.nvm"

# Make sure Node Version Manager is installed.
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "Installing Node Version Manager..."
  wget -qO- "https://raw.githubusercontent.com/creationix/nvm/$NVM_VERSION/install.sh" | bash

  # Activate nvm by restarting Bash.
  # We can restart without needing to log out first.
  # http://stackoverflow.com/a/9584378
  # http://stackoverflow.com/a/29459215
  echo "Restarting Bash..."
  (exec bash)
fi

source "$NVM_DIR/nvm.sh"

# Make sure Node.js is installed.
if [ $(nvm current) == "none" ]; then
  echo "Installing Node.js..."
  nvm install $NODE_VERSION > /dev/null 2>&1
  nvm alias default $NODE_VERSION
fi

# Make sure nginx is installed.
if [ ! "$(which nginx)" ]; then
  # https://www.youtube.com/watch?v=Cv4yNbpJgP0
  # http://pastebin.com/d3ANccRL
  echo "Get the nginx public key..."
  wget http://nginx.org/keys/nginx_signing.key --directory-prefix=/tmp --quiet
  sudo apt-key add /tmp/nginx_signing.key
  sudo sh -c "echo 'deb http://nginx.org/packages/mainline/ubuntu/ trusty nginx' >> /etc/apt/sources.list.d/nginx.list"
  sudo sh -c "echo 'deb-src http://nginx.org/packages/mainline/ubuntu/ trusty nginx' >> /etc/apt/sources.list.d/nginx.list"
  sudo apt-get update --assume-yes
  sudo apt-get install nginx=$NGINX_VERSION --assume-yes
fi

# Load our own files into the Vagrant box.
if [ -d $BOX_FOLDER ]; then
  echo "Putting files into position..."
  ESCAPED_BOX_FOLDER=$(printf %s "$BOX_FOLDER" | sed 's/[][()\.\/^$?*+]/\\&/g')
  for i in $(find $BOX_FOLDER -type f); do
    LOCAL_PATH=$(echo $i | sed -e "s/$ESCAPED_BOX_FOLDER//")
    sudo cp $i $LOCAL_PATH
  done
fi
