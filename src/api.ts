import { dialog, FileFilter, IpcMainInvokeEvent } from "electron";
import dirTree from "directory-tree";
import { DirectoryTree, DirectoryTreeOptions } from "directory-tree";
import express, { Router } from "express";

export const expressApp = express();
const fileRouter = Router();

expressApp.get("/", (req, res) => {
  res.send("Hello, World!");
});

expressApp.use("/files", fileRouter);

interface PreloadApiFunction {
  (event: IpcMainInvokeEvent, ...args: any[]): any;
}

function fileFiltersToRegex(filters: FileFilter[], includeDot: boolean = false): RegExp {
  const regexStr = filters.map((f) => f.extensions.join("|")).join("|");
  return new RegExp(`\.${regexStr}$`);
}

const selectDirectoryTrees: PreloadApiFunction = async function (
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

const serveDirectoryTree: PreloadApiFunction = async function (event: IpcMainInvokeEvent, tree: DirectoryTree) {
  console.log("Serving:", tree.path);
  // TODO test
  fileRouter.use(express.static(tree.path));
  //expressApp.use(`/${tree.name}`, express.static(tree.path));
};

export const API: { [name: string]: PreloadApiFunction } = {
  "dialog:selectDirectoryTrees": selectDirectoryTrees,
  "server:serveDirectoryTree": serveDirectoryTree,
};
