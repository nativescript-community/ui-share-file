import { ShareOptions } from '@nativescript-community/ui-share-file';
import {Application} from '@nativescript/core';

// we need to store both the controller and the delegate.
// UIDocumentInteractionController is not retained by iOS
// the delegate is not retained by the controller
const storedData: {
    [k: number]: {
        controller: UIDocumentInteractionController;
        delegate: UIDocumentInteractionControllerDelegateImpl;
    };
} = {};

export class ShareFile {
    myId = Date.now();
    private resolve: Function;
    open(args: ShareOptions) {
        return new Promise((resolve, reject) => {
            if (!args.path) {
                return reject(new Error('missing_arg_path'));
            }
            try {
                const appPath = this.getCurrentAppPath();
                const path = args.path.replace('~', appPath);
                const url = NSURL.fileURLWithPath(path);
                const animated = args.animated !== false;
                const controller = UIDocumentInteractionController.interactionControllerWithURL(
                    url
                );
                controller.UTI = args?.type || 'public.data, public.content';
                controller.name = args.title;
                const presentingController = Application.ios.rootController;
                const delegate = UIDocumentInteractionControllerDelegateImpl.new().initWithOwnerController(
                    this,
                    presentingController
                );
                controller.delegate = delegate;
                let rect;
                if (args.rect) {
                    rect = CGRectMake(
                        args.rect.x ? args.rect.x : 0,
                        args.rect.y ? args.rect.y : 0,
                        args.rect.width ? args.rect.width : 0,
                        args.rect.height ? args.rect.height : 0
                    );
                } else {
                    rect = CGRectMake(0, 0, 0, 0);
                }
                let result = false;
                if (!!args.options) {
                    result = controller.presentOptionsMenuFromRectInViewAnimated(
                        rect,
                        presentingController.view,
                        animated
                    );
                } else {
                    result = controller.presentOpenInMenuFromRectInViewAnimated(
                        rect,
                        presentingController.view,
                        animated
                    );
                }
                if (!result) {
                    return reject(new Error('failed_opening'));
                }
                storedData[this.myId] = {
                    controller,
                    delegate,
                };
                this.resolve = resolve;
            } catch (e) {
                return reject(e);
            }
        }).finally(() => {
            delete storedData[this.myId];
        });
    }
    dismissed() {
        if (this.resolve) {
            this.resolve();
            this.resolve = null;
        }
    }

    private getCurrentAppPath(): string {
        const currentDir = __dirname;
        const tnsModulesIndex = currentDir.indexOf('/tns_modules');

        // Module not hosted in ~/tns_modules when bundled. Use current dir.
        let appPath = currentDir;
        if (tnsModulesIndex !== -1) {
            // Strip part after tns_modules to obtain app root
            appPath = currentDir.substring(0, tnsModulesIndex);
        }
        return appPath;
    }
}

@NativeClass
class UIDocumentInteractionControllerDelegateImpl extends NSObject
    implements UIDocumentInteractionControllerDelegate {
    public static ObjCProtocols = [UIDocumentInteractionControllerDelegate];
    controller: UIViewController;
    private _owner: ShareFile;

    static new(): UIDocumentInteractionControllerDelegateImpl {
        return super.new() as UIDocumentInteractionControllerDelegateImpl;
    }
    public initWithOwnerController(
        owner: ShareFile,
        controller: UIViewController
    ) {
        this._owner = owner;
        this.controller = controller;
        return this;
    }

    documentInteractionControllerWillBeginSendingToApplication(
        controller: UIDocumentInteractionController,
        app: string
    ): void {
        // console.log(
        //     "documentInteractionControllerWillBeginSendingToApplication",
        //     app
        // );
        const owner = this._owner;
        if (owner) {
            owner.dismissed();
        }
    }

    documentInteractionControllerDidDismissOpenInMenu(
        controller: UIDocumentInteractionController
    ): void {
        // console.log("documentInteractionControllerDidDismissOpenInMenu");
        const owner = this._owner;
        if (owner) {
            owner.dismissed();
        }
    }

    documentInteractionControllerDidDismissOptionsMenu(
        controller: UIDocumentInteractionController
    ): void {
        // console.log("documentInteractionControllerDidDismissOptionsMenu");
        const owner = this._owner;
        if (owner) {
            owner.dismissed();
        }
    }

    public documentInteractionControllerViewControllerForPreview(
        controller: UIDocumentInteractionController
    ) {
        return this.controller;
    }

    public documentInteractionControllerViewForPreview(
        controller: UIDocumentInteractionController
    ) {
        return this.controller.view;
    }
    public documentInteractionControllerRectForPreview(
        controller: UIDocumentInteractionController
    ) {
        return this.controller.view.bounds;
    }
}
