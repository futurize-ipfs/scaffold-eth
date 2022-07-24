import { Button, Divider, Input } from 'antd';
import { useSignerAddress, useContractLoader } from 'eth-hooks';
import { useEthersAppContext } from 'eth-hooks/context';
import { TEthersProviderOrSigner } from 'eth-hooks/models';
import { CID } from 'multiformats';
import { base16 } from 'multiformats/bases/base16';
import React, { FC, useEffect, useState } from 'react';
import { Web3Response, Web3Storage } from 'web3.storage';

import * as LitProtocol from '../../LitProtocol';

import { useAppContracts } from '~common/components/context';
import { useScaffoldAppProviders } from '~common/components/hooks/useScaffoldAppProviders';
import deployedContractsJson from '~common/generated/hardhat_contracts.json';
import {
  CONNECT_TO_BURNER_AUTOMATICALLY,
  INFURA_ID,
  LOCAL_PROVIDER,
  MAINNET_PROVIDER,
  TARGET_NETWORK_INFO,
} from '~~/config/app.config';
import { WEB3_STORAGE_API_TOKEN } from '~~/constants';
import { BigNumber } from 'ethers';

export const Access: FC<Record<string, never>> = () => {
  const scaffoldAppProviders = useScaffoldAppProviders({
    targetNetwork: TARGET_NETWORK_INFO,
    connectToBurnerAutomatically: CONNECT_TO_BURNER_AUTOMATICALLY,
    localProvider: LOCAL_PROVIDER,
    mainnetProvider: MAINNET_PROVIDER,
    infuraId: INFURA_ID,
  });

  const ethersAppContext = useEthersAppContext();

  const [newCID, setNewCID] = useState('loading...');

  const [CIDAccess, setCIDAccess] = useState('loading...');
  const [addressAccess, setAddressAccess] = useState('loading...');

  const [CIDRevokeAccess, setCIDRevokeAccess] = useState('loading...');
  const [revokeAddressAccess, setRevokeAddressAccess] = useState('loading...');

  const [checkCid, setCheckCid] = useState('loading...');
  const [checkAddress, setCheckAddress] = useState('loading...');

  const [hasAccess, setHasAccess] = useState(undefined as boolean | undefined);

  const [selectedFiles, setSelectedFiles] = useState(null as FileList | null);
  const [uploadState, setUploadState] = useState('Ready');
  const [downloadState, setDownloadState] = useState('Ready');

  const userSigner = scaffoldAppProviders.currentProvider?.getSigner() as TEthersProviderOrSigner | undefined;

  const writeContracts = useContractLoader({ deployedContractsJson }, userSigner);

  const client = new Web3Storage({
    token: WEB3_STORAGE_API_TOKEN,
    endpoint: new URL('https://api.web3.storage'),
  });

  void LitProtocol.startClient();

  const chain = 'kovan';
  const chainIdString = TARGET_NETWORK_INFO.chainId.toString();
  if (!(chainIdString in deployedContractsJson)) {
    throw new Error(`No contracts deployed on chain with ID ${chainIdString}`);
  }

  // Here we define how the conditions to access the message
  const accessControlConditions = [
    {
      contractAddress: (deployedContractsJson as any)[chainIdString][0].contracts.FuturizeACL.address,
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

  function checkDownloadResponse(response: Web3Response | null): Web3Response {
    if (response === null || !response.ok) {
      let error = `failed to get ${newCID}`;
      if (response !== null) {
        error += ` - [${response.status}] ${response.statusText}`;
      }
      throw new Error(error);
    }

    return response;
  }

  async function uploadAndEncrypt(): Promise<void> {
    if (!selectedFiles) {
      setUploadState('No files selected!');
      return;
    }
    setUploadState('Encrypting your files...');
    const { encryptedZip, symmetricKey } = await LitProtocol.zipEncryptFiles(Array.from(selectedFiles));
    setUploadState('Uploading your files to IPFS...');
    const rootCid = await client.put([new File([encryptedZip], 'encrypted_zip.bin')]);

    accessControlConditions[0].functionParams[0] = '0x' + CID.parse(rootCid).toString(base16.encoder).slice(1);

    setUploadState('Claiming file ownership on chain...');
    await (writeContracts.FuturizeACL as any).createFile(CID.parse(rootCid).bytes);
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
    setUploadState(`Upload successful! CID: ${keyCid}`);
  }

  async function downloadAndDecrypt(): Promise<void> {
    setDownloadState('Downloading metadata file from IPFS...');
    const res = checkDownloadResponse(await client.get(newCID));

    setDownloadState('Reading metadata...');
    const filesZip = await res.files();

    const encryptedFileCID = await filesZip[0].text();
    const encryptedSymmetricKeyBuffer = await filesZip[1].arrayBuffer();

    setDownloadState('Decrypting key...');
    const encryptedSymmetricKeyArrayUint8Array = new Uint8Array(encryptedSymmetricKeyBuffer);
    const encryptedSymmetricKeyString = await LitProtocol.uint8arrayToString(encryptedSymmetricKeyArrayUint8Array);

    setDownloadState('Downloading encrypted file from IPFS...');
    const resEncryptedFile = await client.get(encryptedFileCID);
    const files = await resEncryptedFile?.files();

    if (files === undefined) {
      setDownloadState('Error getting encrypted file from IPFS!');
      return;
    }

    setDownloadState('Decrypting file...');
    const encryptedFile = files[0];

    accessControlConditions[0].functionParams[0] = '0x' + CID.parse(encryptedFileCID).toString(base16.encoder).slice(1);

    const decryptedZip = await LitProtocol.decryptZip(
      accessControlConditions,
      encryptedSymmetricKeyString,
      encryptedFile,
      chain
    );

    const blob = new Blob([decryptedZip]);

    const csvURL = window.URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', 'decryptedZip.zip');
    tempLink.click();
    setDownloadState('Done!');
  }

  async function giveAccess(): Promise<void> {
    const res = checkDownloadResponse(await client.get(CIDAccess));

    const filesZip = await res.files();

    const encryptedFileCID = await filesZip[0].text();

    await (writeContracts.FuturizeACL as any).giveAccess(CID.parse(encryptedFileCID).bytes, addressAccess);
  }

  async function revokeAccess(): Promise<void> {
    const res = checkDownloadResponse(await client.get(CIDRevokeAccess));

    const filesZip = await res.files();

    const encryptedFileCID = await filesZip[0].text();

    await (writeContracts.FuturizeACL as any).revokeAccess(CID.parse(encryptedFileCID).bytes, revokeAddressAccess);
  }

  async function checkAccess(): Promise<void> {
    setHasAccess(undefined);
    const res = checkDownloadResponse(await client.get(checkCid));

    const filesZip = await res.files();

    const encryptedFileCID = await filesZip[0].text();

    const resp = (await (writeContracts.FuturizeACL as any).hasAccess(
      CID.parse(encryptedFileCID).bytes,
      checkAddress
    )) as BigNumber;
    setHasAccess(resp.eq(1));
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
        <h2>Decrypt Files:</h2>
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e): void => {
            setNewCID(e.target.value);
          }}
        />
        <Button
          style={{ marginTop: 8 }}
          onClick={(): void => {
            void downloadAndDecrypt();
          }}>
          Decrypt File!
        </Button>
        <Divider />
        Status: {downloadState}
      </div>

      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <h2>Give Access:</h2>
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e): void => {
            setCIDAccess(e.target.value);
          }}
        />

        <Divider />
        <h4>Address:</h4>
        <Input
          onChange={(e): void => {
            setAddressAccess(e.target.value);
          }}
        />

        <Button
          style={{ marginTop: 8 }}
          onClick={(): void => {
            void giveAccess();
          }}>
          Give Access!
        </Button>
      </div>

      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <h2>Revoke Access:</h2>
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e): void => {
            setCIDRevokeAccess(e.target.value);
          }}
        />

        <Divider />
        <h4>Address:</h4>
        <Input
          onChange={(e): void => {
            setRevokeAddressAccess(e.target.value);
          }}
        />

        <Button
          style={{ marginTop: 8 }}
          onClick={(): void => {
            void revokeAccess();
          }}>
          Revoke Access!
        </Button>
      </div>

      <div style={{ border: '1px solid #cccccc', padding: 16, width: 800, margin: 'auto', marginTop: 64 }}>
        <h2>Check if user has access:</h2>
        <Divider />
        <h4>CID:</h4>
        <Input
          onChange={(e): void => {
            setCheckCid(e.target.value);
          }}
        />

        <Divider />
        <h4>Address:</h4>
        <Input
          onChange={(e): void => {
            setCheckAddress(e.target.value);
          }}
        />
        <Divider />

        <h4>{hasAccess !== undefined ? (hasAccess ? 'Has access' : 'No access') : ''}</h4>
        <Button
          style={{ marginTop: 8 }}
          onClick={(): void => {
            void checkAccess();
          }}>
          Check access!
        </Button>
      </div>
    </>
  );
};
