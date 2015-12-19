#!/bin/bash

# Change these if you need to.
BOX_FOLDER="/vagrant/provision/files"
NVM_VERSION="v0.29.0"
NODE_VERSION="5.3.0"

# We can have our own files loaded into the Vagrant box.
if [ -d $BOX_FOLDER ]; then
  echo "Putting files into position..."
  ESCAPED_BOX_FOLDER=$(printf %s "$BOX_FOLDER" | sed 's/[][()\.\/^$?*+]/\\&/g')
  for i in $(find $BOX_FOLDER -type f); do
    LOCAL_PATH=$(echo $i | sed -e "s/$ESCAPED_BOX_FOLDER//")
    sudo cp $i $LOCAL_PATH
  done
fi

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
