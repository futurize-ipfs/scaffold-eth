import { Button, Divider, Input } from 'antd';
import { GenericContract } from 'eth-components/ant/generic-contract';
import { useSignerAddress, useContractLoader } from 'eth-hooks';
import { useEthersAppContext } from 'eth-hooks/context';
import { CID } from 'multiformats';
import { base16 } from 'multiformats/bases/base16';
import React, { FC, useEffect, useState } from 'react';
import { Web3Storage } from 'web3.storage';

import * as LitProtocol from '../../LitProtocol';

import { useAppContracts } from '~common/components/context';
import { useScaffoldAppProviders } from '~common/components/hooks/useScaffoldAppProviders';
import deployedContractsJson from '~common/generated/hardhat_contracts.json';
import { IScaffoldAppProviders } from '~common/models';
import {
  CONNECT_TO_BURNER_AUTOMATICALLY,
  INFURA_ID,
  LOCAL_PROVIDER,
  MAINNET_PROVIDER,
  TARGET_NETWORK_INFO,
} from '~~/config/app.config';
import { WEB3_STORAGE_API_TOKEN } from '~~/constants';

export interface AccessProps {
  // contract: any;
  // children?: ReactElement;
}

export const Access: FC<AccessProps> = (props) => {
  const scaffoldAppProviders: IScaffoldAppProviders = useScaffoldAppProviders({
    targetNetwork: TARGET_NETWORK_INFO,
    connectToBurnerAutomatically: CONNECT_TO_BURNER_AUTOMATICALLY,
    localProvider: LOCAL_PROVIDER,
    mainnetProvider: MAINNET_PROVIDER,
    infuraId: INFURA_ID,
  }) as IScaffoldAppProviders;

  const ethersAppContext = useEthersAppContext();

  const FuturizeACL = useAppContracts('FuturizeACL', ethersAppContext.chainId);

  const [encryptedMessage, setEncryptedMessage] = useState();


  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState('loading...');

  const [newEncryptedString, setNewEncryptedString] = useState('loading...');

  const [newCID, setNewCID] = useState('loading...');


  const [CIDAcess, setCIDAccess] = useState('loading...');
  const [addressAccess, setAddressAccess] = useState('loading...');


  const [CIDRevokeAccess, setCIDRevokeAccess] = useState('loading...');
  const [revokeAddressAccess, setRevokeAddressAccess] = useState('loading...');

  const [checkCid, setCheckCid] = useState('loading...');
  const [checkAddress, setCheckAddress] = useState('loading...');

  const [hasAccess, setHasAccess] = useState('0');




  const [myAddress] = useSignerAddress(ethersAppContext.signer);

  const [selectedFiles, setSelectedFiles] = useState(null as FileList | null);
  const [uploadState, setUploadState] = useState('Ready');

  const userSigner = scaffoldAppProviders.currentProvider?.getSigner();

  const writeContracts = useContractLoader({ deployedContractsJson }, userSigner);

  useEffect(() => {
    console.log('deployed contracts', deployedContractsJson);
    console.log('userSigner', userSigner);
    console.log('writeContracts', writeContracts);
  });

  const client = new Web3Storage({
    token: WEB3_STORAGE_API_TOKEN as string,
    endpoint: new URL('https://api.web3.storage'),
  });

  // We start litprotocol client
  LitProtocol.startClient();

  const chain = 'kovan';

  // Here we define how the conditions to access the message
  let accessControlConditions = [
    {
      contractAddress: deployedContractsJson[TARGET_NETWORK_INFO.chainId.toString()][0].contracts.FuturizeACL.address,
      // contractAddress: '0x0',
      functionName: 'hasAccess',
      functionParams: ['IPFSCID_CHANGEME', ':userAddress'],
      functionAbi: {
        inputs: [
          {
            internalType: 'bytes',
            name: 'ipfsCid',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'userToCheck',
            type: 'address',
          },
        ],
        name: 'hasAccess',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      chain,
      returnValueTest: {
        key: '',
        comparator: '>',
        value: '0',
      },
    },
  ];

  async function uploadAndEncrypt(): Promise<void> {



    if (!selectedFiles) {
      setUploadState('No files selected!');
      return;
    }
    setUploadState('Encrypting your files...');
    const { encryptedZip, symmetricKey } = await LitProtocol.zipEncryptFiles(Array.from(selectedFiles));
    setUploadState('Uploading your files to IPFS...');
    const rootCid = await client.put([new File([encryptedZip], 'encrypted_zip.bin')]);


    accessControlConditions[0].functionParams[0] = "0x" + CID.parse(rootCid).toString(base16.encoder).slice(1);

    console.log("accessControlConditions declaration", accessControlConditions)
    setUploadState('Claiming file ownership on chain...');
    await writeContracts.FuturizeACL.createFile(CID.parse(rootCid).bytes);
    setUploadState('Encrypting file encryption key...');
    const encryptedKey = await LitProtocol.saveEncryptionKey(symmetricKey, chain, accessControlConditions);

    setUploadState('Uploading encryption key to IPFS...');
    const textFileForEncryptedFileCid = new File(
      [new Blob([rootCid.toString()], { type: 'text/plain' })],
      'encrypted_file_cid.txt'
    );
    const encryptedKeyFile = new File(
      [new Blob([encryptedKey], { type: 'application/octet-stream' })],
      'encrypted_key.bin'
    );
    const keyCid = await client.put([textFileForEncryptedFileCid, encryptedKeyFile]);
    const hexCid = CID.parse(rootCid).toString(base16.encoder);
    setUploadState(`Upload successful! CID: ${keyCid} Hex CID: ${hexCid}`);


  }


  return (
    <>
      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <h2>Encrypt and share files:</h2>
        <Divider />
        <h4>Files:</h4>
        <Input type="file" multiple={true} onChange={(e): void => setSelectedFiles(e.target.files)} />
        <Divider />
        <Button
          style={{ marginTop: 8 }}
          onClick={(): void => {
            void uploadAndEncrypt();
          }}>
          Encrypt File!
        </Button>
        <Divider />
        Status: {uploadState}
      </div>
      <Divider />
      <Divider />
      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <Divider />
        <h2>Decrypt Files:</h2>

        {/* {encryptedMessage} */}
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e) => {
            setNewCID(e.target.value);
          }}
        />

        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {



            const res = await client.get(newCID);

            if (!res.ok) {
              throw new Error(`failed to get ${newCID} - [${res.status}] ${res.statusText}`)
            }

            const filesZip = await res.files()
            for (const file of filesZip) {
              console.log(`${file.cid}`)
            }

            const encryptedFileCID = await filesZip[0].text();
            const encryptedSymmetricKeyBuffer = await filesZip[1].arrayBuffer();

            const encryptedSymmetricKeyArrayUint8Array = new Uint8Array(encryptedSymmetricKeyBuffer);
            const encryptedSymmetricKeyString = await LitProtocol.uint8arrayToString(encryptedSymmetricKeyArrayUint8Array);



            const resEncryptedFile = await client.get(encryptedFileCID);
            const files = await resEncryptedFile?.files();

            const encryptedFile = files[0];


            accessControlConditions[0].functionParams[0] = "0x" + CID.parse(encryptedFileCID).toString(base16.encoder).slice(1);


            const decryptedZip = await LitProtocol.decryptZip(accessControlConditions, encryptedSymmetricKeyString, encryptedFile, chain);

            console.log("decryptedZip", decryptedZip);


            // const zipFile = new File(
            //   [new Blob([decryptedZip], { type: 'application/zip' })],
            //   'decryptedZip.zip'
            // );

            const blob = new Blob([decryptedZip]);

            let csvURL = window.URL.createObjectURL(blob);
            let tempLink = document.createElement('a');
            tempLink.href = csvURL;
            tempLink.setAttribute('download', 'decryptedZip.zip');
            tempLink.click();

            console.log("download successful");




          }}>
          Decrypt File!
        </Button>
      </div>

      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <Divider />
        <h2>Give Access:</h2>

        {/* {encryptedMessage} */}
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e) => {
            setCIDAccess(e.target.value);
          }}
        />

        <Divider />
        <h4>Address:</h4>
        <Input
          onChange={(e) => {
            setAddressAccess(e.target.value);
          }}
        />

        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {

            const res = await client.get(CIDAcess);

            if (!res.ok) {
              throw new Error(`failed to get ${CIDAcess} - [${res.status}] ${res.statusText}`)
            }

            const filesZip = await res.files()
            for (const file of filesZip) {
              console.log(`${file.cid}`)
            }

            const encryptedFileCID = await filesZip[0].text();

            await writeContracts.FuturizeACL.giveAccess(CID.parse(encryptedFileCID).bytes, addressAccess);

          }}>
          Give Access!
        </Button>
      </div>

      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <Divider />
        <h2>Revoke Access:</h2>

        {/* {encryptedMessage} */}
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e) => {
            setCIDRevokeAccess(e.target.value);
          }}
        />

        <Divider />
        <h4>Address:</h4>
        <Input
          onChange={(e) => {
            setRevokeAddressAccess(e.target.value);
          }}
        />

        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {

            const res = await client.get(CIDRevokeAccess);

            if (!res.ok) {
              throw new Error(`failed to get ${CIDRevokeAccess} - [${res.status}] ${res.statusText}`)
            }

            const filesZip = await res.files()
            for (const file of filesZip) {
              console.log(`${file.cid}`)
            }

            const encryptedFileCID = await filesZip[0].text();


            await writeContracts.FuturizeACL.revokeAccess(CID.parse(encryptedFileCID).bytes, revokeAddressAccess);


          }}>
          Revoke Access!
        </Button>
      </div>

      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <Divider />
        <h2>Check if user has access:</h2>

        {/* {encryptedMessage} */}
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e) => {
            setCheckCid(e.target.value);
          }}
        />

        <Divider />
        <h4>Address:</h4>
        <Input
          onChange={(e) => {
            setCheckAddress(e.target.value);
          }}
        />
        <Divider />

        {hasAccess == "1" ? (
          <h4>Has access</h4>
        ) : (
          <h4>No access</h4>
        )
        }
        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {

            const res = await client.get(checkCid);

            if (!res.ok) {
              throw new Error(`failed to get ${checkCid} - [${res.status}] ${res.statusText}`)
            }

            const filesZip = await res.files()
            for (const file of filesZip) {
              console.log(`${file.cid}`)
            }

            const encryptedFileCID = await filesZip[0].text();


            const resp = await writeContracts.FuturizeACL.hasAccess(CID.parse(encryptedFileCID).bytes, checkAddress);

            setHasAccess(resp);

          }}>
          Check!
        </Button>
      </div>


    </>
  );
};
