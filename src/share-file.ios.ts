import { Common } from './share-file.common';

export class ShareFile extends Common {

    constructor() {
        super();
    }

    static getter<T>(_this2: any, property: T | { (): T }): T {
        if (typeof property === "function") {
            return (<{ (): T }>property).call(_this2);
        } else {
            return <T>property;
        }
    }

    open(args: any): boolean {
        if (args.path) {
            try {
                const appPath = this.getCurrentAppPath();
                const path = args.path.replace("~", appPath);

                const controller = UIDocumentInteractionController.interactionControllerWithURL(NSURL.fileURLWithPath(path));
                controller.delegate = new UIDocumentInteractionControllerDelegateImpl2();
                return controller.presentOptionsMenuFromRectInViewAnimated(
                    controller.delegate.documentInteractionControllerRectForPreview(controller),
                    controller.delegate.documentInteractionControllerViewForPreview(controller),
                    true
                );
            }
            catch (e) {
                console.log("ShareFile: Open file failed");
            }
        } else {
            console.log('ShareFile: Please add a file path');
        }
        return false;
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

class UIDocumentInteractionControllerDelegateImpl2 extends NSObject implements UIDocumentInteractionControllerDelegate {
    public static ObjCProtocols = [UIDocumentInteractionControllerDelegate];

    public getViewController(): UIViewController {
        const app = ShareFile.getter(UIApplication, UIApplication.sharedApplication);
        return app.keyWindow.rootViewController;
    }

    public documentInteractionControllerViewControllerForPreview(controller: UIDocumentInteractionController) {
        return this.getViewController();
    }

    public documentInteractionControllerViewForPreview(controller: UIDocumentInteractionController) {
        return this.getViewController().view;
    }

    public documentInteractionControllerRectForPreview(controller: UIDocumentInteractionController): CGRect {
        return this.getViewController().view.frame;
    }
}

