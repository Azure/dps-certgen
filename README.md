## x509 Certificate Helper Tool

- need an easy to use x509 certificate tool ?
- don't have OpenSSL cli or don't know how to use it ?
- all of the above ?

### Requirements

node.js version 8+

### Install

```
npm i -g dps-certgen
```

### Usage

```
dps-certgen <args>

args:
--new-config  : creates a new 'certgen.config.json' file (overwrites the existing one)
--new-root-cert : creates a new root certificate that is based on 'certgen.config.json'
--new-leaf-cert <subject> : creates a new certificate and signs it with the root certificate's private key

--is2K : use 2048 bits (not suggested). default 4096 bits

i.e. => dps-certgen --new-root-cert
```

### Sample apps

- [Azure IoT x509 C SDK client example](./samples/azure-iot-c-sdk/README.md)
- [Azure IoT x509 Python client example](./samples/python/README.md)

### Sample usage

#### Create a new X509 root certificate

Create a new certificate configuration file
```
dps-certgen --new-config
```

Edit `certgen.config.json` file on the path.

Create a new x509 certificate / public and private keys
```
dps-certgen --new-root-cert
```

Command above will create `root-cert.pem`, `root-public-key.pem`, and `root-private-key.pem`
on the path.


#### Verify a root certificate

If any platform asks you to verify your certificate, it will give you a verification key to do that.

Run the command below on your favorite terminal.
Make sure `root-cert.pem`, `root-public-key.pem`, and `root-private-key.pem` are already on the path.
```
dps-certgen --new-leaf-cert PUT_THAT_VERIFICATION_KEY_HERE
```

Command above will create `subject-cert.pem`, `subject-public-key.pem`, and `subject-private-key.pem`
on the path.

Use `subject-cert.pem` in order to verify the ownership.

#### Create a device certificate

Make sure `root-cert.pem`, `root-public-key.pem`, and `root-private-key.pem` are already on the path.
```
dps-certgen --new-leaf-cert PUT_DEVICE_ID_HERE
```

Command above will create `subject-cert.pem`, `subject-public-key.pem`, and `subject-private-key.pem`
on the path.

Use `subject-cert.pem` as device certificate and `subject-private-key.pem` as the private key.
