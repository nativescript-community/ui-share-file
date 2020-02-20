import { ShareOptions } from "nativescript-akylas-share-file";
import * as app from "@nativescript/core/application";

// let controller: UIDocumentInteractionController;
export class ShareFile {
    private controller: UIDocumentInteractionController;
    private delegate: UIDocumentInteractionControllerDelegateImpl;
    private resolve: Function;
    private url: NSURL;
    open(args: ShareOptions) {
        let storedController: UIDocumentInteractionController;
        return new Promise((resolve, reject) => {
            if (!args.path) {
                return reject(new Error("missing_arg_path"));
            }
            try {
                const appPath = this.getCurrentAppPath();
                const path = args.path.replace("~", appPath);
                const url = NSURL.fileURLWithPath(path);
                const animated = args.animated !== false;
                const controller = (storedController = UIDocumentInteractionController.interactionControllerWithURL(
                    url
                ));
                controller.UTI = args?.type || "public.data, public.content";
                controller.name = args.title;
                const presentingController = app.ios.rootController;
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
                    storedController = null;
                    return reject(new Error("failed_opening"));
                }

                // store referecences
                // console.log("storing references", this);
                this.resolve = resolve;
                this.controller = controller;
                this.delegate = delegate;
                this.url = url;
            } catch (e) {
                storedController = null;
                return reject(e);
            }
        }).then(result => {
            storedController = null;
            return result;
        });
    }
    dismissed() {
        // console.log("ShareFile", "dismissed");
        if (this.controller) {
            this.controller.delegate = null;
            this.controller = null;
            // controller = null;
        }
        if (this.delegate) {
            this.delegate = null;
        }
        if (this.url) {
            this.url = null;
        }
        if (this.resolve) {
            this.resolve();
            this.resolve = null;
        }
    }

    private getCurrentAppPath(): string {
        const currentDir = __dirname;
        const tnsModulesIndex = currentDir.indexOf("/tns_modules");

        // Module not hosted in ~/tns_modules when bundled. Use current dir.
        let appPath = currentDir;
        if (tnsModulesIndex !== -1) {
            // Strip part after tns_modules to obtain app root
            appPath = currentDir.substring(0, tnsModulesIndex);
        }
        return appPath;
    }
}

class UIDocumentInteractionControllerDelegateImpl extends NSObject
    implements UIDocumentInteractionControllerDelegate {
    public static ObjCProtocols = [UIDocumentInteractionControllerDelegate];
    controller: UIViewController;
    private _owner: ShareFile;

    // public getViewController(): UIViewController {
    // return app.ios.rootController;

    // const app = ShareFile.getter(
    //   UIApplication,
    //   UIApplication.sharedApplication
    // );
    // return app.keyWindow.rootViewController;
    // }
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
