import { Button, Divider, Input } from 'antd';
import { FC, useState } from 'react';
import { Web3Storage } from 'web3.storage';

import { WEB3_STORAGE_API_TOKEN } from '~~/constants';

export const IPFS: FC<Record<string, never>> = () => {
  const [selectedFiles, setSelectedFiles] = useState(null as FileList | null);
  const [uploadState, setUploadState] = useState('Ready');

  const client = new Web3Storage({
    token: WEB3_STORAGE_API_TOKEN as string,
    endpoint: new URL('https://api.web3.storage'),
  });

  async function uploadFile(): Promise<void> {
    if (selectedFiles) {
      setUploadState('Uploading...');
      const rootCid = await client.put(selectedFiles);
      setUploadState(`Successful! CID: ${rootCid}`);
    } else {
      setUploadState('No files selected!');
    }
  }

  return (
    <>
      <div style={{ border: '1px solid #cccccc', padding: 16, width: 400, margin: 'auto', marginTop: 64 }}>
        <h2>Upload file</h2>
        <Divider />
        <Input type="file" multiple={true} onChange={(e): void => setSelectedFiles(e.target.files)} />
        <Divider />
        <Button
          onClick={(): void => {
            void uploadFile();
          }}>
          Upload
        </Button>
        <Divider />
        Status: {uploadState}
      </div>
    </>
  );
};
