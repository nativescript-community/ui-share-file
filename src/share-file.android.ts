import { AndroidActivityResultEventData, AndroidApplication, android as androidApp } from '@nativescript/core/application';
import { File, Folder } from '@nativescript/core/file-system';

const REQUEST_CODE = 2343;
export class ShareFile {
    open(args: any) {
        if (args.path) {
            return new Promise((resolve, reject) => {
                try {
                    const path = args.path;
                    const intent = new android.content.Intent();
                    const map = android.webkit.MimeTypeMap.getSingleton();
                    const mimeType = map.getMimeTypeFromExtension(this.fileExtension(path));

                    intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    const uri = this._getUriForPath(path, '/' + this.fileName(path), androidApp.context);
                    // uris.add(uri);
                    const builder = new android.os.StrictMode.VmPolicy.Builder();
                    android.os.StrictMode.setVmPolicy(builder.build());

                    intent.setAction(android.content.Intent.ACTION_SEND);
                    intent.setType(args?.type || '*/*');
                    intent.putExtra(android.content.Intent.EXTRA_STREAM, uri);
                    // intent.putParcelableArrayListExtra(
                    //     android.content.Intent.EXTRA_STREAM,
                    //     uris
                    // );

                    const activity = androidApp.foregroundActivity || androidApp.startActivity;

                    const onActivityResultHandler = (data: AndroidActivityResultEventData) => {
                        androidApp.off(AndroidApplication.activityResultEvent, onActivityResultHandler);
                        if (data.requestCode === REQUEST_CODE) {
                            resolve(data.resultCode);
                        }
                    };
                    androidApp.on(AndroidApplication.activityResultEvent, onActivityResultHandler);
                    // activity.startActivityForResult(
                    //   new android.content.Intent(
                    //     android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS
                    //   ),
                    //   0
                    // );
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

    _getUriForPath(path, fileName, ctx) {
        if (path.indexOf('file:///') === 0) {
            return this._getUriForAbsolutePath(path);
        } else if (path.indexOf('file://') === 0) {
            return this._getUriForAssetPath(path, fileName, ctx);
        } else if (path.indexOf('base64:') === 0) {
            return this._getUriForBase64Content(path, fileName, ctx);
        } else {
            if (path.indexOf(ctx.getPackageName()) > -1) {
                return this._getUriForAssetPath(path, fileName, ctx);
            } else {
                return this._getUriForAbsolutePath(path);
            }
        }
    }
    _getUriForAbsolutePath(path) {
        const absPath = path.replace('file://', '');
        const file = new java.io.File(absPath);
        if (!file.exists()) {
            console.log('File not found: ' + file.getAbsolutePath());
            return null;
        } else {
            return android.net.Uri.fromFile(file);
        }
    }
    _getUriForAssetPath(path, fileName, ctx) {
        path = path.replace('file://', '/');
        if (!File.exists(path)) {
            console.log('File does not exist: ' + path);
            return null;
        }
        const localFile = File.fromPath(path);
        const localFileContents = localFile.readSync(function (e) {
            console.log(e);
        });
        let cacheFileName = this._writeBytesToFile(ctx, fileName, localFileContents);
        if (cacheFileName.indexOf('file://') === -1) {
            cacheFileName = 'file://' + cacheFileName;
        }
        return android.net.Uri.parse(cacheFileName);
    }
    _getUriForBase64Content(path, fileName, ctx) {
        const resData = path.substring(path.indexOf('://') + 3);
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
        const storage = dir.toString() + '/filecomposer';
        let cacheFileName = storage + '/' + fileName;
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
        if (androidApp.context) {
            const dir = androidApp.context.getExternalCacheDir();
            const storage = dir.toString() + '/filecomposer';
            const cacheFolder = Folder.fromPath(storage);
            cacheFolder.clear();
        }
    }
    toStringArray(arg) {
        const arr = java.lang.reflect.Array.newInstance(java.lang.String.class, arg.length);
        for (let i = 0; i < arg.length; i++) {
            arr[i] = arg[i];
        }
        return arr;
    }
}
