#!/bin/bash

BOX_FOLDER='/vagrant/provision/files'

if [ -d $BOX_FOLDER ]; then

  echo 'Putting files into position...'

  ESCAPED_BOX_FOLDER=$(printf %s "$BOX_FOLDER" | sed 's/[][()\.\/^$?*+]/\\&/g')

  for i in $(find $BOX_FOLDER -type f); do
    LOCAL_PATH=$(echo $i | sed -e "s/$ESCAPED_BOX_FOLDER//")
    cp $i $LOCAL_PATH
  done

fi
