import * as observable from '@nativescript/core/data/observable';
import * as pages from '@nativescript/core/ui/page';
import {HelloWorldModel} from './main-view-model';

import { ShareFile } from "@nativescript-community/ui-share-file";
import * as fs from "@nativescript/core/file-system";
// Event handler for Page 'loaded' event attached in main-page.xml
export function pageLoaded(args: observable.EventData) {
    // Get the event sender
    let page = <pages.Page>args.object;
    page.bindingContext = new HelloWorldModel();
}
export async function onTap() {
    try {
        const fileName = "report.txt";
        const documents = fs.knownFolders.documents();
        const filepath = fs.path.join(documents.path, fileName);
        const file = fs.File.fromPath(filepath);
        await file.writeText("Send this txt to other apps");
        setTimeout(() => {
            __collect();
        }, 1000);
        await  new ShareFile().open({
            path: filepath,
            title: "Open text file with:",
            rect: {
                x: 110,
                y: 110,
                width: 0,
                height: 0,
            },
            options: true,
            animated: true,
        });
    } catch (e) {
        alert(e);
        console.log("Error while creating text file", e);
    }
}