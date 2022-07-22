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

  const accessTests = useAppContracts('AccessTests', ethersAppContext.chainId);

  const [encryptedMessage, setEncryptedMessage] = useState();

  const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState('loading...');

  const [newEncryptedString, setNewEncryptedString] = useState('loading...');

  const [newSymmetricKeyString, setNewSymmetricKeyString] = useState('loading...');

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
      //contractAddress: deployedContractsJson[TARGET_NETWORK_INFO.chainId.toString()][0].contracts.FuturizeACL.address,
      contractAddress: '0x0',
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
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      chain,
      returnValueTest: {
        key: '',
        comparator: '==',
        value: 'true',
      },
    },
  ];

  async function uploadAndEncrypt(): Promise<void> {
    // ---- Saving to IPFS ----

    // Here we need to save the recipient address on chain
    // This address will be able to decrypt the message
    // We need to save the encrypted message on IPFS
    // We also need to save the encryptedSimmetricKey to IPFS?
    // Web3Storage here

    // ---- Using Lit Protocol to encrypt ----
    // We use the accessControlConditions that are also going to be transacted in the following lines of code
    if (!selectedFiles) {
      setUploadState('No files selected!');
      return;
    }
    setUploadState('Encrypting your files...');
    const { encryptedZip, symmetricKey } = await LitProtocol.zipEncryptFiles(Array.from(selectedFiles));
    setUploadState('Uploading your files to IPFS...');
    const rootCid = await client.put([new File([encryptedZip], 'encrypted_zip.bin')]);
    accessControlConditions[0].functionParams[0] = rootCid;
    setUploadState('Claiming file ownership on chain...');
    console.log('writeContracts', writeContracts);
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

    // ---- Saving on chain the contracts that can access the message ----

    // We call the Access contract so our recipient address has the condition to access the message

    // tx(writeContracts.AccessTests.giveAccess(newAddress));

    // ---- SONR Blockchain ----

    // Here we save the signatures then we use our Eth smart contract to emit events with these
    // signatures
  }

  // const accessControlConditions = [
  //     {
  //         contractAddress: '0xEb6645593B1B6325f818ACFCA2Dc0D1f969DD54c',
  //         standardContractType: 'ERC721',
  //         chain,
  //         method: 'balanceOf',
  //         parameters: [
  //             ':userAddress'
  //         ],
  //         returnValueTest: {
  //             comparator: '>',
  //             value: '0'
  //         }
  //     }
  // ]

  return (
    <>
      <div style={{ border: '1px solid #cccccc', padding: 16, width: 400, margin: 'auto', marginTop: 64 }}>
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
          Encrypt Message!
        </Button>
        <Divider />
        Status: {uploadState}
      </div>
      <Divider />
      <Divider />
      <div style={{ border: '1px solid #cccccc', padding: 16, width: 400, margin: 'auto', marginTop: 64 }}>
        <Divider />
        <h2>Decrypt messages:</h2>

        {/* {encryptedMessage} */}
        <Divider />
        {encryptedSymmetricKey}

        {}

        <h4>Messages to decrypt: </h4>

        {/* Here we should have the list of encrypted messages/Files with relation to the
                logged Identity
                Where do we ge these ? from events? 
                Then a button to decrypt them 

                // We then get from IPFS the encrypted Message and the encryptedSymmetricKey

                decryptedMessage = LitProtocol.decryptMessage(accessControlConditions, encryptedSymmetricKey, encryptedString);
                */}
        <h4>Message to decrypt:</h4>
        <Input
          onChange={(e) => {
            setNewEncryptedString(e.target.value);
          }}
        />

        <h4>Encrypted Symmetric Key String: </h4>
        <Input
          onChange={(e) => {
            setNewSymmetricKeyString(e.target.value);
          }}
        />

        <Button
          style={{ marginTop: 8 }}
          onClick={async () => {
            console.log('accessControlConditions', accessControlConditions);

            console.log('#######', test);

            const response = await LitProtocol.decryptMessage(
              accessControlConditions,
              newSymmetricKeyString,
              encryptedMessage,
              chain
            );

            console.log('Decrypted String', response);
          }}>
          Decrypt Message!
        </Button>
      </div>

      <GenericContract
        contractName="YourContract"
        contract={accessTests}
        mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
        blockExplorer={scaffoldAppProviders.targetNetwork.blockExplorer}
      />
    </>
  );
};
