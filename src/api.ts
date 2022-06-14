import { dialog, FileFilter, IpcMainInvokeEvent } from "electron";
import dirTree from "directory-tree";
import { DirectoryTree, DirectoryTreeOptions } from "directory-tree";

interface PreloadApiFunction {
  (event: IpcMainInvokeEvent, ...args: any[]): any;
}

function fileFiltersToRegex(filters: FileFilter[], includeDot: boolean = false): RegExp {
  console.log(filters);
  const regexStr = filters.map((f) => f.extensions.join("|")).join("|");
  return new RegExp(`\.${regexStr}$`);
}

const selectDirectoryTree: PreloadApiFunction = async function (
  event: IpcMainInvokeEvent,
  filters: FileFilter[]
): Promise<DirectoryTree[]> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select Folder",
    filters,
    properties: ["openDirectory", "multiSelections"],
  });

  if (canceled) {
    return [];
  }

  const opts: DirectoryTreeOptions = {
    attributes: ["extension", "type"],
    normalizePath: true,
    extensions: fileFiltersToRegex(filters),
  };

  return filePaths.map((path) => dirTree(path, opts));
};

// TODO - express/serve-static to serve up all files in the tree
const serveDirectoryTree: PreloadApiFunction = async function (event: IpcMainInvokeEvent, tree: DirectoryTree) {};

// TODO
const unserveDirectoryTree: PreloadApiFunction = async function (event: IpcMainInvokeEvent, tree: DirectoryTree) {};

export const API: { [name: string]: PreloadApiFunction } = {
  "dialog:selectDirectoryTree": selectDirectoryTree,
  "server:serveDirectoryTree": serveDirectoryTree,
  "server:unserveDirectoryTree": unserveDirectoryTree,
};
