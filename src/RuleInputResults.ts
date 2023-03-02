import * as vscode from 'vscode';
import {Position, TreeItemLabel, Uri} from "vscode";



class ScanResult extends vscode.TreeItem
{
  children: undefined;
  position: Position;

  constructor(label: TreeItemLabel, uri: Uri, position: Position) {
    super(label);
    this.resourceUri = uri;
    this.position = position;
  }
}

class FileResults extends vscode.TreeItem
{
  children: ScanResult[] | undefined;
  position: Position;

  constructor(label: string, uri: Uri, children?: ScanResult[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
    this.resourceUri = uri;
    this.position = new Position(0, 0);
    this.description = true;
  }
}


export class DiagnosticTreeView implements vscode.TreeDataProvider<FileResults>
    {
        // will hold our tree view data
        data : FileResults [] = [];

        private _onDidChangeTreeData: vscode.EventEmitter<FileResults | undefined | null | void> = new vscode.EventEmitter<FileResults | undefined | null | void>();

        readonly onDidChangeTreeData: vscode.Event<FileResults | undefined | null | void> = this._onDidChangeTreeData.event;

          constructor() {
            this.data = [];
          }

          getTreeItem(element: FileResults|ScanResult): vscode.TreeItem|Thenable<vscode.TreeItem> {
            // element.command = {command: 'vscode.open', arguments: [element.uri], title: 'Open'}
            element.command = {command: 'editor.action.goToLocations', title: "Open", arguments: [element.resourceUri, element.position , [], "goto"] }

            return element;
          }

          getChildren(element?: FileResults|ScanResult|undefined): vscode.ProviderResult<FileResults[]|ScanResult[]> {
            if (element === undefined) {
              return this.data;
            }
            return element.children;
          }

          refresh(params): void {
            let uri = Uri.parse(params['uri']);
            let scanResults = []
            for (let result of params["diagnostics"]) {
                scanResults.push(new ScanResult({label:result["first_line_code"], highlights:[result["first_line_highlight"]]}, uri, new Position(result["range"]["start"]["line"], result["range"]["start"]["character"])));
            }
            this.data.push(new FileResults(params["name"], uri, scanResults));
            this._onDidChangeTreeData.fire();
          }

          clear(): void {
            this.data = [];
            this._onDidChangeTreeData.fire();
          }
    }