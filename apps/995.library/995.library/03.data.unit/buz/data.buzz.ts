//const ffmpeg = require("fluent-ffmpeg");

export const initData = (cpy: DataModel, bal: DataBit, ste: State) => {
  debugger;
  return cpy;
};

export const updateData = (cpy: DataModel, bal: DataBit, ste: State) => {
  return cpy;
};

export const frameData = (cpy: DataModel, bal: DataBit, ste: State) => {
  const videoFile = '../films/' + bal.src;
  const outputDir = '../frames';

  const FS = require('fs-extra');

  FS.emptyDirSync(outputDir);

  // Create output directory if it doesn't exist
  if (!FS.existsSync(outputDir)) {
    FS.mkdirSync(outputDir);
  }

  //  var itm = new ffmpeg(videoFile)
  //      .on("end", () => {

  //          console.log("Frames extracted successfully!");

  //           bal.slv({ palBit: { idx: "frame-pixel" } });
  //       })
  //       .on("error", (err) => {
  //           console.error("An error occurred:", err);
  //       })
  //       .takeScreenshots({
  //           count: 48, // Number of frames to extract
  //            filename: "frame.png", // Output filename pattern
  //           folder: outputDir, // Output directory
  //       });

  // itm.setFfmpegPath(ffmpegPath);

  return cpy;
};

import type { DataModel } from '../data.model';
import type DataBit from '../fce/data.bit';
import type State from '../../99.core/state';
