export interface DropboxFolder {
    id: string;
    name: string;
    path_lower: string;
}
export interface DropboxFile {
    id: string;
    name: string;
    path_lower: string;
    size: number;
}
export declare function listFolders(rootPath?: string): Promise<DropboxFolder[]>;
export declare function listImages(folderPath: string): Promise<DropboxFile[]>;
export declare function ensureDirectLink(filePath: string): Promise<string>;
//# sourceMappingURL=dropbox.d.ts.map