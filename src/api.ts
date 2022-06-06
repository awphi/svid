import { dialog, FileFilter, IpcMainInvokeEvent } from "electron";
import { readFile } from "fs/promises";

interface PreloadApiFunction {
  (event: IpcMainInvokeEvent, ...args: any[]): any;
}

const readFiles: PreloadApiFunction = async function readFiles(
  event: IpcMainInvokeEvent,
  filters: FileFilter[]
): Promise<string[]> {
  console.log(filters);
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select Files",
    filters,
    properties: ["openFile", "multiSelections"],
  });

  if (canceled) {
    return [];
  }

  const d = await readFile(filePaths[0]);
  console.log(d);

  return filePaths;
};

export const API: { [name: string]: PreloadApiFunction } = { "dialog:readFiles": readFiles };
