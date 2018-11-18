import { config,S3 } from 'aws-sdk';
import { join, basename } from 'path';
import { createReadStream } from 'fs';

export class AWS {
    public constructor() {
        //add config details to awsconfig.json
        config.loadFromPath(join(__dirname+'/../../awsconfig.json'));
        this.s3 = new S3({apiVersion: '2006-03-01'});
        //add bucket name here
        this.bucket = "";
    }

    public S3UploadFile(file: string, userid: string, imageid: string): string {
        const body = createReadStream(file);
        body.on('error', (err) => {
            console.log("File error:",err);
        });
        const key = userid+'_'+imageid;
        const params = {Bucket: this.bucket, Key: key, Body: body};
        this.s3.upload(params, (err: any, data: any) => {
            if(err) {
                console.log("Upload error:",err);
            }
            if(data) {
                return data.Location;
            }
        });
        return "";
    }

    public S3DeleteFile(key: string): Boolean {
        const params = {Bucket: this.bucket, Key: key};
        this.s3.deleteObject(params, (err: any, data: any) => {
            if(err) {
                console.log("Delete error:",err);
            }
            if(data) {
                return true;
            }
        });
        return false;
    }

    private s3: S3;
    private bucket: string;
}


