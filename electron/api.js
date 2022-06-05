const { dialog } = require("electron");

async function readFiles(event, filters) {
  console.log(filters);
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Select Files",
    filters,
    properties: ["openFile", "multiSelections"],
  });

  if (canceled) {
    return null;
  }

  // TODO file reading & parsing

  return filePaths;
}

module.exports = { "dialog:readFiles": readFiles };
