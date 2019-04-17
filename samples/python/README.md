### Connect to Azure IoT with Python X509

Step by step x509 client authentication with Python

### Clone SDK and install dependencies

Install `dps-certgen`
```
npm i -g dps-certgen
```

Make sure you have Python 2.7+, or Python 3.4+ or Micropython 1.9+

Install `iotc`
```
pip install iotc
```

### Create and register an x509 certificate

We will need an environment to use this certificate and connect to iothub.

- Visit [apps.azureiotcentral.com](https://apps.azureiotcentral.com) for a free Azure iothub and Azure iot dps setup.
- Click to `New Application` button
- Select `Trial` and `Sample Devkits`... then click `Create`
- Browse `Administration` tab on the left

At this point, lets create the root certificate that we are going to use for the app.
```
dps-certgen --new-root-cert
```

Running the command above will generate the files below.
(in case you want to modify the specifics of this root cert, update the `certgen.config.json` file and re-run the command above)
```
./root-cert.pem
./root-public-key.pem
./root-private-key.pem
```

- Back to Azure IoT Central `Administration` Tab
- Click to `Device Connection` and under the `Credetentials` select `Certificates (X509)`
- Click to blue `folder` button and select `root-cert.pem` that you've created above
- Click to blue `cog` button and get the verification code. (you may need to click to blue recycle button to generate one)

Use the `verification code` as shown below to generate verification certificate;
```
dps-certgen --new-leaf-cert <put verification code here>
```

Running the command above will generate the files below
```
./subject-cert.pem
./subject-public-key.pem
./subject-private-key.pem
```

- Back to Azure IoT Central and click to blue `Verify` button.
- Select the `subject-cert.pem` that you've created above
- That's it! Azure IoT setup is complete.

Now it's time to create a certificate for our sample device.

Assuming the device id is `dev1`
```
dps-certgen --new-leaf-cert dev1
```

Running the command above will generate the files below for `dev1`
```
./subject-cert.pem
./subject-public-key.pem
./subject-private-key.pem
```

- edit `app.py` at your favorite editor and update `DEVICE_ID` to `dev1` (consistent with the leaf certificate above)
- Go back to Azure iot central and copy `Scope Id` from `Administration` / `Device Connection`
- on `app.py`, update `SCOPE_ID` to the one you've just grabbed from iot central

Let's try
```
python app.py
```

You will possibly see an error regarding to provisioning.

- Go back to `Azure iot central` and browse `Device Explorer` > `Unassociated device`
- Select `dev1`. From the top menu, select `associate` (second left icon on the top bar menu)

Now, it should run just fine!
```
python app.py
```

You may monitor the fake telemetry from Azure iot central's device explorer.