### Azure IoT C SDK - x509 client sample

Step by step x509 client authentication with Azure IoT Client C SDK.

### Clone SDK and install dependencies

Clone SDK
```
git clone https://github.com/azure/azure-iot-sdk-c
```

Install `dps-certgen`
```
npm i -g dps-certgen
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

open `subject-cert.pem` and update `hsm_client_riot.c` (`CERTIFICATE`) with the contents of it,
also update `PRIVATE_KEY` under `hsm_client_riot.c` with the contents of `subject-private-key.pem`

- update `DEVICE_ID` under `hsm_client_riot.c` to `dev1` (which our device certificate is created for)
- find `provisioning_client/adapters/hsm_client_riot.c` under `Azure-iot-sdk-c` folder and replace it with the one you just updated here
- locate `provisioning_client/tools/CMakeLists.txt` under `Azure-iot-sdk-c` and remove `add_tool_directory(dice_device_enrollment)`

- Go back Azure iot central and copy `Scope Id` from `Administration` / `Device Connection`
- edit `./provisioning_client/samples/prov_dev_client_ll_sample/prov_dev_client_ll_sample.c` under `Azure-iot-sdk-c`
- use the `Scope Id` you got to update `static const char* id_scope = "[ID Scope]";`

- find `"{ \"message_index\" : \"%zu\" }"` and update it to `"{ \"temp\" : \"%zu\" }"` (basically, we will send a fake temperature telemetry)

- Remember, this is the sample code file you'll be working with. (`prov_dev_client_ll_sample.c`)

- go under `Azure-iot-sdk-c` folder on your favorite terminal

```
mkdir build
cd build
cmake -Duse_prov_client:BOOL=ON ..
make -j3
```

This will create `./provisioning_client/samples/prov_dev_client_ll_sample/prov_dev_client_ll_sample` under `build` folder

Let's try
```
./provisioning_client/samples/prov_dev_client_ll_sample/prov_dev_client_ll_sample
```

You will possibly see an error regarding to provisioning.

- Go back to `Azure iot central` and browse `Device Explorer` > `Unassociated device`
- Select `dev1`. From the top menu, select `associate` (second left icon on the top bar menu)

Now, it should run just fine!
```
./provisioning_client/samples/prov_dev_client_ll_sample/prov_dev_client_ll_sample
```