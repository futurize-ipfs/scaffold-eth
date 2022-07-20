import { Button, Card, DatePicker, Divider, Input, Progress, Slider, Spin, Switch } from "antd";
import React, { FC, useState, ReactElement } from "react";
import { GenericContract } from 'eth-components/ant/generic-contract';
import { NETWORKS } from '~common/constants';
import { useEthersAppContext } from 'eth-hooks/context';
import { useScaffoldAppProviders } from '~common/components/hooks/useScaffoldAppProviders';



import { useLoadAppContracts, useConnectAppContracts, useAppContracts } from '~common/components/context';

import * as LitProtocol from "../../LitProtocol";


import {
    useBalance,
    useBlockNumber,
    useContractReader,
    useEthersAdaptorFromProviderOrSigners,
    useGasPrice,
    useSignerAddress,
} from 'eth-hooks';

import {
    BURNER_FALLBACK_ENABLED,
    CONNECT_TO_BURNER_AUTOMATICALLY,
    INFURA_ID,
    LOCAL_PROVIDER,
    MAINNET_PROVIDER,
    TARGET_NETWORK_INFO,
} from '~~/config/app.config';
import { const_blockNumberIntervalLong } from "eth-hooks/models";






export interface AccessProps {
    // contract: any;
    // children?: ReactElement;

}



export const Access: FC<AccessProps> = (props) => {

    const scaffoldAppProviders = useScaffoldAppProviders({
        targetNetwork: TARGET_NETWORK_INFO,
        connectToBurnerAutomatically: CONNECT_TO_BURNER_AUTOMATICALLY,
        localProvider: LOCAL_PROVIDER,
        mainnetProvider: MAINNET_PROVIDER,
        infuraId: INFURA_ID,
    });

    const ethersAppContext = useEthersAppContext();

    const accessTests = useAppContracts('AccessTests', ethersAppContext.chainId);


    const [newMessage, setNewMessage] = useState("loading...");
    const [newAddress, setNewAddress] = useState("loading...");

    const [encryptedMessage, setEncryptedMessage] = useState();

    const [encryptedSymmetricKey, setEncryptedSymmetricKey] = useState("loading...");

    const [newEncryptedString, setNewEncryptedString] = useState("loading...");

    const [newSymmetricKeyString, setNewSymmetricKeyString] = useState("loading...");

    const [myAddress] = useSignerAddress(ethersAppContext.signer);


    let test = 0;

    //We start litprotocol client
    LitProtocol.startClient();

    const chain = "kovan";



    // Here we define how the conditions to access the message
    const accessControlConditions = [
        {
            contractAddress: '0x0982746fdA0e4f17616FE4E184e9a6e0C235E8E0',
            functionName: "hasAccess",
            functionParams: [
                ':userAddress'
            ],
            functionAbi: {
                inputs: [
                    {
                        "internalType": "address",
                        "name": "",
                        "type": "address"
                    }
                ],
                name: "hasAccess",
                outputs: [
                    {
                        "internalType": "string",
                        "name": "",
                        "type": "string"
                    }
                ],
                "stateMutability": "view",
                "type": "function",
            },
            chain,
            returnValueTest: {
                comparator: '>=',
                value: '0'
            }
        }
    ]

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
            <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
                <h2>Encrypt messages:</h2>
                <Divider />
                <h4>Message to encrypt:</h4>
                <Input
                    onChange={e => {
                        setNewMessage(e.target.value);
                    }}
                />
                <Divider />
                <h4>Recipient address: </h4>
                <Input
                    onChange={e => {
                        setNewAddress(e.target.value);
                    }}
                />
                <Divider />
                <Button
                    style={{ marginTop: 8 }}
                    onClick={async () => {

                        // ---- Saving to IPFS ----

                        // Here we need to save the recipient address on chain
                        // This address will be able to decrypt the message
                        // We need to save the encrypted message on IPFS 
                        // We also need to save the encryptedSimmetricKey to IPFS? 
                        // Web3Storage here 


                        // ---- Using Lit Protocol to encrypt ----
                        // We use the accessControlConditions that are also going to be transacted in the following lines of code

                        const response = await LitProtocol.encryptSaveMessage(accessControlConditions, chain, newMessage);

                        console.log("response", response);

                        console.log("encrypted Message", await response.encryptedString);

                        const encryptedSymmetricKey = response.encryptedSymmetricKey;

                        test = await response.encryptedString;

                        setEncryptedMessage(test);

                        console.log("testttt###", test)

                        const encryptedSymmetricKeyString = await LitProtocol.uint8arrayToString(encryptedSymmetricKey);

                        setEncryptedSymmetricKey(encryptedSymmetricKeyString);

                        console.log("encryptedSymmetricKeyString", encryptedSymmetricKeyString);

                        // ---- Saving on chain the contracts that can access the message ----

                        // We call the Access contract so our recipient address has the condition to access the message

                        // tx(writeContracts.AccessTests.giveAccess(newAddress));

                        // ---- SONR Blockchain ----

                        // Here we save the signatures then we use our Eth smart contract to emit events with these 
                        // signatures


                    }}
                >
                    Encrypt Message!
                </Button>
            </div>
            <Divider />
            <Divider />
            <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
                <Divider />
                <h2>Decrypt messages:</h2>

                {/* {encryptedMessage} */}
                <Divider />
                {encryptedSymmetricKey}

                { }

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
                    onChange={e => {
                        setNewEncryptedString(e.target.value);
                    }}
                />

                <h4>Encrypted Symmetric Key String: </h4>
                <Input
                    onChange={e => {
                        setNewSymmetricKeyString(e.target.value);
                    }}
                />

                <Button
                    style={{ marginTop: 8 }}
                    onClick={async () => {

                        console.log("accessControlConditions", accessControlConditions)

                        console.log("#######", test);

                        const response = await LitProtocol.decryptMessage(accessControlConditions, newSymmetricKeyString, encryptedMessage, chain);



                        console.log("Decrypted String", response);

                    }}
                >
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
}
