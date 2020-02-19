import { ShareOptions } from "nativescript-akylas-share-file";
import * as app from "@nativescript/core/application";

export class ShareFile {
    static getter<T>(_this2: any, property: T | { (): T }): T {
        if (typeof property === "function") {
            return (<{ (): T }>property).call(_this2);
        } else {
            return <T>property;
        }
    }

    private controller: UIDocumentInteractionController;
    private delegate: UIDocumentInteractionControllerDelegateImpl2;

    resolve;
    open(args: ShareOptions) {
        return new Promise((resolve, reject) => {
            if (!args.path) {
                return reject(new Error("missing_arg_path"));
            }
            try {
                const appPath = this.getCurrentAppPath();
                const path = args.path.replace("~", appPath);
                const url = NSURL.fileURLWithPath(path);
                const animated = args.animated !== false;

                const controller = (this.controller = UIDocumentInteractionController.interactionControllerWithURL(
                    url
                ));
                this.controller.UTI = args.type
                    ? args.type
                    : "public.data, public.content";
                controller.name = args.title;
                const presentingController = app.ios.rootController;
                const delegate = UIDocumentInteractionControllerDelegateImpl2.initWithOwnerController(
                    this,
                    presentingController
                );
                this.delegate = delegate;
                controller.delegate = delegate;

                // console.log(
                //     "open",
                //     appPath,
                //     args.path,
                //     path,
                //     url,
                //     url.absoluteString,
                //     presentingController,
                //     controller,
                //     delegate
                // );

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
                    return reject(new Error("failed_opening"));
                }
                this.resolve = resolve
                // return Promise.resolve(result);
            } catch (e) {
                return reject(e);
            }
        });
    }
    dismissed() {
        // console.log("ShareFile", "dismissed");
        if (this.controller) {
            this.controller.delegate = null;
            this.controller = null;
        }
        this.delegate = null;
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

class UIDocumentInteractionControllerDelegateImpl2 extends NSObject
    implements UIDocumentInteractionControllerDelegate {
    public static ObjCProtocols = [UIDocumentInteractionControllerDelegate];
    owner: ShareFile;
    controller: UIViewController;

    // public getViewController(): UIViewController {
    // return app.ios.rootController;

    // const app = ShareFile.getter(
    //   UIApplication,
    //   UIApplication.sharedApplication
    // );
    // return app.keyWindow.rootViewController;
    // }

    static initWithOwnerController(
        owner: ShareFile,
        controller: UIViewController
    ) {
        const result = new UIDocumentInteractionControllerDelegateImpl2();
        result.owner = owner;
        result.controller = controller;
        return result;
    }

    documentInteractionControllerWillBeginSendingToApplication(
        controller: UIDocumentInteractionController,
        app: string
    ): void {
        // console.log(
        //     "documentInteractionControllerWillBeginSendingToApplication",
        //     app
        // );
        if (this.owner) {
            this.owner.dismissed();
        }
        this.owner = null;
    }

    documentInteractionControllerDidDismissOpenInMenu(
        controller: UIDocumentInteractionController
    ): void {
        // console.log("documentInteractionControllerDidDismissOpenInMenu");
        if (this.owner) {
            this.owner.dismissed();
        }
        this.owner = null;
    }

    documentInteractionControllerDidDismissOptionsMenu(
        controller: UIDocumentInteractionController
    ): void {
        // console.log("documentInteractionControllerDidDismissOptionsMenu");
        if (this.owner) {
            this.owner.dismissed();
        }
        this.owner = null;
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
