import LitJsSdk from "lit-js-sdk";

// Need to start lit client with this function, then use encryptSaveMessage to encrypt a message
// then decryptMessage to recover the message

export async function startClient() {
  const client = new LitJsSdk.LitNodeClient();
  await client.connect();
  window.litNodeClient = client;
}

type AuthSig = {
  sig: string;
  derivedVia: string;
  signedMessage: string;
  address: string;
};

// Function to make a signature
export async function checkAndSignAuthMessage(chain: string): Promise<AuthSig> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const authSig = (await LitJsSdk.checkAndSignAuthMessage({ chain: chain })) as AuthSig;

  return authSig;
}

export async function encryptString(
  authSig,
  accessControlConditions,
  chain,
  message
) {
  const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
    message
  );
  console.log("encryptedString", encryptedString);

  const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
    evmContractConditions: accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  });

  return {
    encryptedSymmetricKey,
    symmetricKey,
    encryptedString,
  };
}

export async function zipEncryptFiles(files: File[]): Promise<{ encryptedZip: Blob; symmetricKey: Uint8Array }> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  return (await LitJsSdk.zipAndEncryptFiles(files)) as { encryptedZip: Blob; symmetricKey: Uint8Array };
}

export async function saveEncryptionKey(
  symmetricKey: Uint8Array,
  chain: string,
  accessControlConditions: any
): Promise<Uint8Array> {
  const authSig = await checkAndSignAuthMessage(chain);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const encryptedKey = (await window.litNodeClient.saveEncryptionKey({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  })) as Uint8Array;

  return encryptedKey;
}

// example conditions for users that at least have 1 token to decrypt a message

// const accessControlConditions = [
//     {
//         contractAddress: '0x319ba3aab86e04a37053e984bd411b2c63bf229e',
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

// Function to encrypt a message, the conditions to decrypt, chain and the message

export async function encryptSaveMessage(
  accessControlConditions,
  chain,
  message
) {
  // await startClient();

  const authSig = await checkAndSignAuthMessage(chain);

  const { encryptedSymmetricKey, symmetricKey, encryptedString } =
    await encryptString(authSig, accessControlConditions, chain, message);

  console.log(encryptedSymmetricKey);
  console.log(symmetricKey);
  console.log(encryptedString);

  // encryptedSymmetricKeyG = encryptedSymmetricKey;
  // symmetricKeyG = symmetricKey;
  // encryptedStringG = encryptedString;

  return { encryptedSymmetricKey, symmetricKey, encryptedString };
}

export async function zipEncryptSaveFiles(
  accessControlConditions,
  chain,
  files
) {
  const authSig = await checkAndSignAuthMessage(chain);

  const { encryptedSymmetricKey, symmetricKey, encryptedString } =
    await zip(authSig, accessControlConditions, chain, message);
}

// Function to decrypt the message, you need the conditions to decrypt,  the
//  results of the encryptSaveMessage (encryptedSymmetricKey,encryptedString) and the chain

export async function decryptMessage(
  accessControlConditions,
  encryptedSymmetricKey,
  encryptedString,
  chain
) {
  const authSig = await checkAndSignAuthMessage(chain);
  // const chain = 'rinkeby';

  const symmetricKey = await window.litNodeClient.getEncryptionKey({
    evmContractConditions: accessControlConditions,
    toDecrypt: encryptedSymmetricKey,
    chain,
    authSig,
  });

  const decryptedString = await LitJsSdk.decryptString(
    encryptedString,
    symmetricKey
  );

  return decryptedString;
}

export async function uint8arrayToString(encryptedSymmetricKey) {
  const encryptedSymmetricKeyString = LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")

  return encryptedSymmetricKeyString;

} 
