const fs = require("fs");
const Jimp = require("jimp");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function distortImage(pixelData, distortionPercentage) {
  const numAffectedPixels = Math.floor(
    (pixelData.length / 4) * (distortionPercentage / 100)
  );
  for (let i = 0; i < numAffectedPixels; i++) {
    const idx = randomInt(0, pixelData.length - 4);
    pixelData[idx] = randomInt(0, 255);
    pixelData[idx + 1] = randomInt(0, 255);
    pixelData[idx + 2] = randomInt(0, 255);
    pixelData[idx + 3] = randomInt(0, 255);
  }
}

function shiftRow(pixelData, rowIndex, imageWidth, shiftAmount) {
  const startIdx = rowIndex * imageWidth * 4;
  const row = pixelData.slice(startIdx, startIdx + imageWidth * 4);

  for (let i = 0; i < imageWidth; i++) {
    const destIdx = startIdx + ((i + shiftAmount) % imageWidth) * 4;
    pixelData[destIdx] = row[i * 4];
    pixelData[destIdx + 1] = row[i * 4 + 1];
    pixelData[destIdx + 2] = row[i * 4 + 2];
    pixelData[destIdx + 3] = row[i * 4 + 3];
  }
}

function shiftColumn(
  pixelData,
  colIndex,
  imageWidth,
  imageHeight,
  shiftAmount
) {
  const column = [];
  for (let i = 0; i < imageHeight; i++) {
    const idx = (i * imageWidth + colIndex) * 4;
    column.push(
      pixelData[idx],
      pixelData[idx + 1],
      pixelData[idx + 2],
      pixelData[idx + 3]
    );
  }

  for (let i = 0; i < imageHeight; i++) {
    const destIdx =
      ((i + shiftAmount) % imageHeight) * imageWidth * 4 + colIndex * 4;
    pixelData[destIdx] = column[i * 4];
    pixelData[destIdx + 1] = column[i * 4 + 1];
    pixelData[destIdx + 2] = column[i * 4 + 2];
    pixelData[destIdx + 3] = column[i * 4 + 3];
  }
}

function warpImage(
  pixelData,
  imageWidth,
  imageHeight,
  numGroups,
  maxGroupSize,
  uniform
) {
  // Determine sizes of each group
  const groupSizes = [];
  for (let i = 0; i < numGroups; i++) {
    groupSizes.push(uniform ? maxGroupSize : randomInt(1, maxGroupSize + 1));
  }

  groupSizes.forEach((groupSize) => {
    const isColumnShift = Math.random() > 0.5;
    const totalElements = isColumnShift ? imageHeight : imageWidth;

    // Choose a random starting index for this group
    const startIndex = randomInt(0, totalElements - groupSize);
    const shiftAmount = randomInt(1, groupSize + 1); // Decide shift magnitude

    for (let j = 0; j < groupSize && startIndex + j < totalElements; j++) {
      const currentIndex = startIndex + j;
      if (isColumnShift) {
        shiftColumn(
          pixelData,
          currentIndex,
          imageWidth,
          imageHeight,
          shiftAmount
        );
      } else {
        shiftRow(pixelData, currentIndex, imageWidth, shiftAmount);
      }
    }
  });
}

const argv = yargs(hideBin(process.argv))
  .option("s", {
    alias: "source",
    describe: "Path to the source image",
    type: "string",
    demandOption: true,
  })
  .option("r", {
    alias: "repeat",
    describe: "Number of recursive operations",
    type: "number",
    default: 1,
  })
  .option("d", {
    alias: "distortion",
    describe: "Percentage of the image to distort",
    type: "number",
  })
  .option("w", {
    alias: "warp",
    describe:
      "Arguments for warping: [number of groups, max group size, uniform size (true/false)]",
    type: "array",
  })
  .option("c", {
    alias: "chaos",
    describe: "Apply a random distortion and warping",
    type: "boolean",
  })
  .help().argv;

(async function () {
  const image = await Jimp.read(argv.s);
  let pixelData = image.bitmap.data;

  for (let i = 0; i < argv.r; i++) {
    if (argv.d) {
      distortImage(pixelData, argv.d);
    }

    if (argv.w && argv.w.length >= 3) {
      const numGroups = argv.w[0];
      const maxSize = argv.w[1];
      const uniform = argv.w[2];
      warpImage(
        pixelData,
        image.bitmap.width,
        image.bitmap.height,
        numGroups,
        maxSize,
        uniform
      );
    }

    if (argv.c) {
      const distortionPercentage = randomInt(1, 100);
      distortImage(pixelData, distortionPercentage);

      const numGroups = randomInt(1, 10);
      const maxSize = randomInt(
        1,
        Math.min(image.bitmap.width, image.bitmap.height)
      );
      const uniform = Math.random() > 0.5;
      warpImage(
        pixelData,
        image.bitmap.width,
        image.bitmap.height,
        numGroups,
        maxSize,
        uniform
      );
    }
  }

  image.write("output.png", (err) => {
    if (err) console.error("Error writing the image:", err);
    else console.log("Image processing complete. Saved to output.png.");
  });
})();
