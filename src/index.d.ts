export interface ShareOptions {
  path: string;
  rect?: {
    x;
    y;
    width;
    height;
  };
  animated?:boolean
  options?:boolean
  title?:string
  type?:string
}
export declare class ShareFile {
  open(args: ShareOptions): Promise<boolean>;
}
