import { Utils } from '@nativescript/core';
import { AndroidActivityResultEventData, AndroidApplication, android as androidApp } from '@nativescript/core/application';
import { File, Folder, path } from '@nativescript/core/file-system';

const REQUEST_CODE = 2343;
export class ShareFile {
    open(args: any) {
        if (args.path) {
            return new Promise((resolve, reject) => {
                try {
                    const intent = new android.content.Intent();
                    const context = Utils.android.getApplicationContext();
                    // const map = android.webkit.MimeTypeMap.getSingleton();
                    // const mimeType = map.getMimeTypeFromExtension(this.fileExtension(path));
                    if (args.dontGrantReadUri !== true) {
                        intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    }
                    if (Array.isArray(args.path)) {
                        const uris = new java.util.ArrayList();
                        args.path.forEach((p) => uris.add(this._getUriForPath(p, this.fileName(p), context)));
                        intent.putParcelableArrayListExtra(android.content.Intent.EXTRA_STREAM, uris);
                        intent.setAction(android.content.Intent.ACTION_SEND_MULTIPLE);
                    } else {
                        const path = args.path;
                        const uri = this._getUriForPath(path, this.fileName(path), context);
                        intent.putExtra(android.content.Intent.EXTRA_STREAM, uri);
                        intent.setAction(android.content.Intent.ACTION_SEND);
                    }

                    const builder = new android.os.StrictMode.VmPolicy.Builder();
                    android.os.StrictMode.setVmPolicy(builder.build());

                    intent.setType(args?.type || '*/*');

                    const activity = androidApp.foregroundActivity || androidApp.startActivity;

                    const onActivityResultHandler = (data: AndroidActivityResultEventData) => {
                        androidApp.off(AndroidApplication.activityResultEvent, onActivityResultHandler);
                        if (data.requestCode === REQUEST_CODE) {
                            resolve(data.resultCode);
                        }
                    };
                    androidApp.on(AndroidApplication.activityResultEvent, onActivityResultHandler);
                    activity.startActivityForResult(android.content.Intent.createChooser(intent, args.title || 'Open file:'), REQUEST_CODE);
                } catch (e) {
                    reject(e);
                }
            });
        } else {
            return Promise.reject(new Error('missing_arg_path'));
            // throw new Error("missing_arg_path");
        }
    }

    fileExtension(filename) {
        return filename.split('.').pop();
    }
    fileName(filename) {
        return filename.split('/').pop();
    }

    _getUriForPath(filePath, fileName, ctx) {
        try {
            const file = new java.io.File(filePath);
            return androidx.core.content.FileProvider.getUriForFile(androidApp.foregroundActivity || androidApp.startActivity, androidApp.packageName + '.provider', file);
        } catch (err) {
            console.error(err);
        }
        if (filePath.indexOf('file:///') === 0) {
            return this._getUriForAbsolutePath(filePath);
        } else if (filePath.indexOf('file://') === 0) {
            return this._getUriForAssetPath(filePath, fileName, ctx);
        } else if (filePath.indexOf('base64:') === 0) {
            return this._getUriForBase64Content(filePath, fileName, ctx);
        } else {
            if (filePath.startsWith('/data') && filePath.indexOf(ctx.getPackageName()) > -1) {
                return this._getUriForAssetPath(filePath, fileName, ctx);
            } else {
                return this._getUriForAbsolutePath(filePath);
            }
        }
    }
    _getUriForAbsolutePath(filePath) {
        const absPath = filePath.replace('file://', '');
        const file = new java.io.File(absPath);
        if (!file.exists()) {
            console.log('File not found: ' + file.getAbsolutePath());
            return null;
        } else {
            return android.net.Uri.fromFile(file);
        }
    }
    _getUriForAssetPath(filePath, fileName, ctx) {
        filePath = filePath.replace('file://', '/');
        if (!File.exists(filePath)) {
            console.log('File does not exist: ' + filePath);
            return null;
        }
        const localFile = File.fromPath(filePath);
        const localFileContents = localFile.readSync(function (e) {
            console.log(e);
        });
        let cacheFileName = this._writeBytesToFile(ctx, fileName, localFileContents);
        if (cacheFileName.indexOf('file://') === -1) {
            cacheFileName = 'file://' + cacheFileName;
        }
        return android.net.Uri.parse(cacheFileName);
    }
    _getUriForBase64Content(filePath, fileName, ctx) {
        const resData = filePath.substring(filePath.indexOf('://') + 3);
        let bytes;
        try {
            bytes = android.util.Base64.decode(resData, 0);
        } catch (ex) {
            console.log('Invalid Base64 string: ' + resData);
            return android.net.Uri.EMPTY;
        }
        const cacheFileName = this._writeBytesToFile(ctx, fileName, bytes);
        return android.net.Uri.parse(cacheFileName);
    }
    _writeBytesToFile(ctx, fileName, contents) {
        const dir = ctx.getExternalCacheDir();
        if (dir === null) {
            console.log('Missing external cache dir');
            return null;
        }
        let cacheFileName = path.join(dir.toString(), 'filecomposer', fileName);
        const toFile = File.fromPath(cacheFileName);
        toFile.writeSync(contents, function (e) {
            console.log(e);
        });
        if (cacheFileName.indexOf('file://') === -1) {
            cacheFileName = 'file://' + cacheFileName;
        }
        return cacheFileName;
    }
    _cleanAttachmentFolder() {
        const context = Utils.android.getApplicationContext();
        if (context) {
            const dir = context.getExternalCacheDir();
            const storage = path.join(dir.toString(), 'filecomposer');
            const cacheFolder = Folder.fromPath(storage);
            cacheFolder.clear();
        }
    }
}
