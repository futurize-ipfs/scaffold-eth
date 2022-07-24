const LitJsSdk = require("lit-js-sdk");

declare global {
  interface Window {
    litNodeClient: any;
  }
}

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
    evmContractConditions: accessControlConditions,
    symmetricKey,
    authSig,
    chain,
  })) as Uint8Array;

  return encryptedKey;
}

export async function decryptZip(
  accessControlConditions: any,
  encryptedSymmetricKey: string,
  encryptedZipBlob: Blob,
  chain: string
): Promise<ArrayBuffer> {
  const authSig = await checkAndSignAuthMessage(chain);

  const symmetricKey = await window.litNodeClient.getEncryptionKey({
    evmContractConditions: accessControlConditions,
    toDecrypt: encryptedSymmetricKey,
    chain,
    authSig,
  });

  const decryptedFiles = await LitJsSdk.decryptFile({ file: encryptedZipBlob, symmetricKey });

  return decryptedFiles as ArrayBuffer;
}

export async function uint8arrayToString(encryptedSymmetricKey: Uint8Array): Promise<string> {
  const encryptedSymmetricKeyString = await LitJsSdk.uint8arrayToString(encryptedSymmetricKey, "base16")

  return encryptedSymmetricKeyString as string;
}
