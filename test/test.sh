#!/bin/bash
# ----------------------------------------------------------------------------
#  Copyright (C) Microsoft
#  Licensed under the MIT license.
# ----------------------------------------------------------------------------

rm -f *.pem
rm -f *.json

CERT_FILE='certgen.config.json'

# check if --new-config will create a config file
node ../index.js --new-config > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path.. [1]'
    exit 1
fi
rm $CERT_FILE

# check if new-root-cert will create a config file (when there is no any)
node ../index.js --new-root-cert > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path.. [2]'
    exit 1
fi

# update config file
node -e "fs=require('fs');f=JSON.parse(fs.readFileSync('./$CERT_FILE'));f.XXX=1;fs.writeFileSync('./$CERT_FILE',JSON.stringify(f,0,2))"
if [ $? != 0 ]; then
    exit 1;
fi

# see if new-root-cert will overwrite the config file
node ../index.js --new-root-cert > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path.. [3]'
    exit 1
fi

node -e "fs=require('fs');f=JSON.parse(fs.readFileSync('./$CERT_FILE'));if(f.XXX != 1) {console.error('new-root-cert overwrote the config file');process.exit(1);}"
if [ $? != 0 ]; then
    exit 1;
fi

# create and verify a leaf cert
node ../index.js --new-leaf-cert 12345 > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path..  [4]'
    exit 1
fi

# see if new-leaf-cert has overwrote the config file
node -e "fs=require('fs');f=JSON.parse(fs.readFileSync('./$CERT_FILE'));if(f.XXX != 1) {console.error('new-root-cert overwrote the config file');process.exit(1);}"
if [ $? != 0 ]; then
    exit 1;
fi

# try all with 2K

rm -f *.pem
rm -f *.json

# check if --new-config will create a config file
node ../index.js --new-config --is2K > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path..  [5]'
    exit 1
fi
rm $CERT_FILE

# check if new-root-cert will create a config file (when there is no any)
node ../index.js --new-root-cert --is2K > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path..  [6]'
    exit 1
fi

# update config file
node -e "fs=require('fs');f=JSON.parse(fs.readFileSync('./$CERT_FILE'));f.XXX=1;fs.writeFileSync('./$CERT_FILE',JSON.stringify(f,0,2))"
if [ $? != 0 ]; then
    exit 1;
fi

# see if new-root-cert will overwrite the config file
node ../index.js --new-root-cert --is2K > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path..  [7]'
    exit 1
fi

node -e "fs=require('fs');f=JSON.parse(fs.readFileSync('./$CERT_FILE'));if(f.XXX != 1) {console.error('new-root-cert overwrote the config file');process.exit(1);}"
if [ $? != 0 ]; then
    exit 1;
fi

# create and verify a leaf cert
node ../index.js --new-leaf-cert 12345 --is2K > /dev/null
if [ ! -f $CERT_FILE ]; then
    echo '$CERT_FILE is not on the path..  [8]'
    exit 1
fi

# see if new-leaf-cert has overwrote the config file
node -e "fs=require('fs');f=JSON.parse(fs.readFileSync('./$CERT_FILE'));if(f.XXX != 1) {console.error('new-root-cert overwrote the config file');process.exit(1);}"
if [ $? != 0 ]; then
    exit 1;
fi

# put 2K in between the subject and --new-leaf-cert
node ../index.js --new-leaf-cert --is2K 12345 > /dev/null 2>&1
if [ $? == 0 ]; then
    echo "Test:  put 2K in between the subject and --new-leaf-cert .... was supposed to fail! (expectedly)"
    exit 1;
fi

rm -f *.pem
rm -f *.json

echo "PASS!"