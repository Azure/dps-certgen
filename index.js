#!/usr/bin/env node
// ----------------------------------------------------------------------------
//  Copyright (C) Microsoft
//  Licensed under the MIT license.
// ----------------------------------------------------------------------------

const path = require('path');
const fs = require('fs');
const forge = require('node-forge');
const colors = require('colors');

var pki = forge.pki;
var user_current_path = process.cwd();
var default_config = {
  'cert_defaults':
    [{
      name: 'countryName',
      value: 'US'
    }, {
      shortName: 'ST',
      value: 'Washington'
    }, {
      name: 'localityName',
      value: 'Redmond'
    }, {
      name: 'organizationName',
      value: 'CoolOrg'
    }, {
      shortName: 'OU',
      value: 'TestCertificate-' + (Date.now() % 99)
    }],
  'cert_extensions':
    [{
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'extKeyUsage',
      clientAuth: true,
      timeStamping: true
    }, {
      name: 'nsCertType',
      client: true
    }, {
      name: 'subjectAltName',
      altNames: [{
        type: 6, // URI
        value: 'http://example.org/webid#me'
      }, {
        type: 7, // IP
        ip: '127.0.0.1'
      }
      ]
    }, {
      name: 'subjectKeyIdentifier'
    }],
  validity : {
    notBefore : 0,
    notAfter  : 0
  }
};

default_config.validity.notBefore = new Date();
default_config.validity.notAfter = new Date();
default_config.validity.notAfter.setFullYear(default_config.validity.notBefore.getFullYear() + 2);
var rand_serial_number = (Date.now() % 99) + '';
rand_serial_number = rand_serial_number.length > 1 ? rand_serial_number : ('0' + rand_serial_number);
default_config.serialNumber = rand_serial_number;

var user_config;
var is2K = false;

function read_cofig() {
  // check if user has a cert config file
  if (fs.existsSync(path.join(user_current_path, 'certgen.config.json'))) {
    try {
      user_config = JSON.parse(fs.readFileSync('certgen.config.json'));
    } catch (e) {
      console.error('ERROR (while reading certgen.config.json)', e.message);
      process.exit();
    }
  } else {
    user_config = JSON.parse(JSON.stringify(default_config));
  }
}

function dump_config(force) {
  var exists = fs.existsSync(path.join(user_current_path, 'certgen.config.json'));
  if (force || !exists) {
    var config_path = path.join(user_current_path, 'certgen.config.json');
    console.log('\nDumped default certificate configuration into', colors.bold(config_path));
    console.log('Feel free to edit this file and execute `dps-certgen` tool with `--new-root-cert` argument to use it');
    fs.writeFileSync(config_path, JSON.stringify(default_config, 0, 2));
  }
}

function create_root() {
  console.log('\nCreating a new certificate..');
  console.log('\t... it may take some time.');
  // generate a keypair and create an X.509v3 certificate
  var keys = pki.rsa.generateKeyPair(is2K ? 2048 : 4096);
  var cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;

  cert.serialNumber = user_config['serialNumber'];
  cert.validity.notBefore = new Date(user_config['validity'].notBefore);
  cert.validity.notAfter = new Date(user_config['validity'].notAfter);

  cert.setSubject(user_config['cert_defaults']);
  cert.setIssuer(user_config['cert_defaults']);
  cert.setExtensions(user_config['cert_extensions']);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // convert a Forge certificate to PEM
  var pem = pki.certificateToPem(cert);
  var private_key = pki.privateKeyToPem(keys.privateKey);
  var public_key = pki.publicKeyToPem(keys.publicKey);
  console.log('');
  var cert_path = path.join(user_current_path, './root-cert.pem');
  console.log('Writing certificate into ', cert_path);
  fs.writeFileSync(cert_path, pem);

  var public_key_path = path.join(user_current_path, './root-public-key.pem');
  console.log('Writing public key into ', public_key_path);
  fs.writeFileSync(public_key_path, public_key);

  var private_key_path = path.join(user_current_path, './root-private-key.pem');
  console.log('Writing private key into ', private_key_path);
  fs.writeFileSync(private_key_path, private_key);
}

function create_signed(subject) {
  console.log('\nCreating a leaf certificate with subject..');
  console.log('\t... it may take some time.');
  // generate a keypair and create an X.509v3 certificate
  var keys = {}, root_cert;
  var root_cert_path = path.join(user_current_path, 'root-cert.pem');
  var pem_private_path = path.join(user_current_path, 'root-private-key.pem');
  var pem_public_path = path.join(user_current_path, 'root-public-key.pem');
  try {
    root_cert = pki.certificateFromPem(fs.readFileSync(root_cert_path) + '');
    keys.privateKey = pki.privateKeyFromPem(fs.readFileSync(pem_private_path) + '');
    keys.publicKey  = pki.publicKeyFromPem(fs.readFileSync(pem_public_path) + '');
  } catch(e) {
    console.error('Error:',
      'Something went wrong while reading private key from pem file @',
      pem_private_path, 'or @', pem_public_path);
    console.error(e.message);
    process.exit(1);
  }

  var leaf_keys = pki.rsa.generateKeyPair(is2K ? 2048 : 4096);
  var cert = pki.createCertificate();
  cert.publicKey = leaf_keys.publicKey;

  var sign_config = JSON.parse(JSON.stringify(user_config));
  sign_config.cert_defaults.push({
    'name': 'commonName',
    'value': subject
  });

  cert.serialNumber = sign_config.serialNumber;
  cert.validity.notBefore = new Date(user_config['validity'].notBefore);
  cert.validity.notAfter = new Date(user_config['validity'].notAfter);

  cert.setSubject(sign_config['cert_defaults']);
  cert.setExtensions(user_config['cert_extensions']);
  cert.setIssuer(root_cert.subject.attributes);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  if (!root_cert.verify(cert)) {
    console.error('Error:', 'Something went wrong while issuing leaf certificate.');
    process.exit(1);
  }
  // convert a Forge certificate to PEM
  var pem = pki.certificateToPem(cert);
  var private_key = pki.privateKeyToPem(leaf_keys.privateKey);
  var public_key = pki.publicKeyToPem(leaf_keys.publicKey);

  var cert_path = path.join(user_current_path, './subject-cert.pem');
  console.log('Writing certificate into ', cert_path);
  fs.writeFileSync(cert_path, pem);

  var public_key_path = path.join(user_current_path, './subject-public-key.pem');
  console.log('Writing public key into ', public_key_path);
  fs.writeFileSync(public_key_path, public_key);

  var private_key_path = path.join(user_current_path, './subject-private-key.pem');
  console.log('Writing private key into ', private_key_path);
  fs.writeFileSync(private_key_path, private_key);
}

function showUsage() {
  console.log('Usage:');
  console.log(colors.bold('dps-certgen'), '<args>');
  console.log('\nargs:');
  console.log('--new-config  : creates a new certgen.config.json file (overwrites the existing one)');
  console.log('--new-root-cert : creates a new root certificate that is based on certgen.config.json');
  console.log('--new-leaf-cert <subject> : creates a new certificate and signs it with the root certificate\'s private key');
  console.log('\n--is2K : use 2048 bits. default 4096 bits');
  console.log('\ni.e. => dps-certgen --new-root-cert');
  console.log('');
}

function main() {
  var version = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'))).version;
  console.log(`\nAzure IoT x509 Cerficate Helper Tool v${version}`);

  if (process.argv.length < 3) {
    showUsage();
    process.exit(0);
  }

  var args = {
    '--new-config': 0,
    '--new-root': 0,
    '--new-cert': 0,
    '--new-root-cert': 0,
    '--new-leaf': 0,
    '--new-leaf-cert': 0,
    '--is2K': 0,
    '--is2k': 0
  };

  var found_arg = 0;

  for (var i  = 1; i < process.argv.length; i++) {
    var arg = process.argv[i];
    if (arg.startsWith('-')) {
      if (args.hasOwnProperty(arg)) {
        args[arg] = 1;
        found_arg = 1;
        if (arg == '--new-leaf-cert' || arg == '--new-leaf') {
          if (i + 1 >= process.argv.length) {
            console.error('Error:', arg + ' argument needs <subject>');
            process.exit(1);
          }
          if (process.argv[i + 1] == '--is2K' || process.argv[i + 1] == '--is2k') {
            console.error('Error:', 'Put subject right after \'' + arg + '\'.. ');
            process.exit(1);
          }
          args['--new-leaf-cert'] = process.argv[i + 1]; i++;
        }
      }
    }
  }

  if (found_arg == 0) {
    showUsage();
    process.exit(1);
  }

  var config_dumped = false;
  if (args['--is2K'] || args['--is2k']) {
    is2K = true;
  }

  if (args['--new-config']) {
    dump_config(1 /* force */);
    config_dumped = true;
  }

  if (args['--new-root-cert'] || args['--new-cert'] || args['--new-root']) {
    if (!config_dumped) dump_config(0 /*dont force*/);
    read_cofig();
    create_root();
  }

  if (args['--new-leaf-cert'] || args['--new-leaf']) {
    if (!config_dumped) dump_config(0 /*dont force*/);
    read_cofig();
    if (!fs.existsSync(path.join(user_current_path, 'root-private-key.pem'))) {
      create_root();
    }
    create_signed(args['--new-leaf-cert']);
  }

  console.log('\ndone.');
}

main();