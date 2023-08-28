const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomDouble(min, max) {
  return Math.random() * (max - min) + min;
}

function shouldApplyMethod(intensity) {
  return Math.random() * 100 <= intensity;
}

function distortImage(pixelData, distortionPercentage, editAlpha) {
  const numAffectedPixels = Math.floor(
    (pixelData.length / 4) * (distortionPercentage / 100)
  );
  for (let i = 0; i < numAffectedPixels; i++) {
    const idx = randomInt(0, pixelData.length - 4);
    pixelData[idx] = randomInt(0, 255);
    pixelData[idx + 1] = randomInt(0, 255);
    pixelData[idx + 2] = randomInt(0, 255);
    if (editAlpha) {
      pixelData[idx + 3] = randomInt(0, 255);
    }
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
  const groupSizes = [];
  for (let i = 0; i < numGroups; i++) {
    groupSizes.push(uniform ? maxGroupSize : randomInt(1, maxGroupSize + 1));
  }

  groupSizes.forEach((groupSize) => {
    const isColumnShift = Math.random() > 0.5;
    const totalElements = isColumnShift ? imageHeight : imageWidth;

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

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function pastelizeImage(pixelData, strength) {
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    const [h, s, l] = rgbToHsl(r, g, b);

    let newH = h;
    if (h < 1 / 6) {
      // Reds and yellows
      newH = 2 / 3 + h * 0.5; // Blue to purple
    } else if (h < 1 / 2) {
      // Greens
      newH = 1 / 6 + h * 0.5; // Cyan/teal
    } else if (h < 2 / 3) {
      // Blues
      newH = h;
    } else {
      // Browns and more red shades
      newH = h - 1 / 6; // Shift to pink/purple
    }

    const newS = Math.min(1, s + 0.5 * (strength / 100));
    const newL =
      l < 0.5 ? l * (1 - 0.2 * (strength / 100)) : l + 0.2 * (strength / 100);

    const [newR, newG, newB] = hslToRgb(newH, newS, newL);

    pixelData[i] = newR;
    pixelData[i + 1] = newG;
    pixelData[i + 2] = newB;
  }
}

function randomizeVaporwaveHues(pixelData, intensity) {
  for (let i = 0; i < pixelData.length; i += 4) {
    const r = pixelData[i];
    const g = pixelData[i + 1];
    const b = pixelData[i + 2];

    const [s, l] = rgbToHsl(r, g, b);

    const vaporHues = [290, 320, 200, 160, 210, 240];

    // Randomly select a vaporwave hue
    const randomVaporHue =
      vaporHues[Math.floor(Math.random() * vaporHues.length)];

    // Adjust saturation and lightness based on intensity
    const adjustedS = s * (1 - intensity) + intensity;
    const adjustedL = l * (1 - intensity) + intensity;

    const [newR, newG, newB] = hslToRgb(
      randomVaporHue / 360,
      adjustedS,
      adjustedL
    );

    pixelData[i] = newR;
    pixelData[i + 1] = newG;
    pixelData[i + 2] = newB;
  }
}

function applyScanlines(
  pixelData,
  imageWidth,
  imageHeight,
  scanlineSpacing,
  scanlineThickness,
  opacity
) {
  for (let y = 0; y < imageHeight; y++) {
    if (y % scanlineSpacing === 0) {
      const startY = y;
      const endY = Math.min(y + scanlineThickness, imageHeight);

      for (let currentY = startY; currentY < endY; currentY++) {
        for (let x = 0; x < imageWidth; x++) {
          const idx = (currentY * imageWidth + x) * 4;

          const adjustedOpacity = opacity / 100;

          pixelData[idx] *= adjustedOpacity; // R channel
          pixelData[idx + 1] *= adjustedOpacity; // G channel
          pixelData[idx + 2] *= adjustedOpacity; // B channel
        }
      }
    }
  }
}

function lerp(a, b, alpha) {
  return a * (1 - alpha) + b * alpha;
}

function applyWave(
  pixelData,
  imageWidth,
  imageHeight,
  waveAmplitude,
  waveFrequency,
  direction,
  alpha
) {
  if (direction === "vertical") {
    for (let x = 0; x < imageWidth; x++) {
      const waveOffset = Math.sin(x / waveFrequency) * waveAmplitude;

      for (let y = 0; y < imageHeight; y++) {
        const newY = y + waveOffset;

        if (newY >= 0 && newY < imageHeight) {
          const srcIdx = (Math.floor(newY) * imageWidth + x) * 4;
          const destIdx = (y * imageWidth + x) * 4;

          for (let i = 0; i < 3; i++) {
            pixelData[destIdx + i] = lerp(
              pixelData[destIdx + i],
              pixelData[srcIdx + i],
              alpha
            );
          }
        }
      }
    }
  } else {
    for (let y = 0; y < imageHeight; y++) {
      const waveOffset = Math.sin(y / waveFrequency) * waveAmplitude;

      for (let x = 0; x < imageWidth; x++) {
        const newX = x + waveOffset;

        if (newX >= 0 && newX < imageWidth) {
          const srcIdx = (y * imageWidth + Math.floor(newX)) * 4;
          const destIdx = (y * imageWidth + x) * 4;

          for (let i = 0; i < 3; i++) {
            pixelData[destIdx + i] = lerp(
              pixelData[destIdx + i],
              pixelData[srcIdx + i],
              alpha
            );
          }
        }
      }
    }
  }
}

function applyVHSTrackingError(
  pixelData,
  imageWidth,
  imageHeight,
  strength,
  frequency,
  direction,
  alpha
) {
  const waveAmplitude = strength;
  const waveFrequency = frequency;
  if (direction == "both") {
    applyWave(
      pixelData,
      imageWidth,
      imageHeight,
      waveAmplitude,
      waveFrequency,
      "horizontal",
      alpha
    );
    applyWave(
      pixelData,
      imageWidth,
      imageHeight,
      waveAmplitude,
      waveFrequency,
      "vertical",
      alpha
    );
  } else {
    applyWave(
      pixelData,
      imageWidth,
      imageHeight,
      waveAmplitude,
      waveFrequency,
      direction,
      alpha
    );
  }
}

function applyChromaAberration(
  pixelData,
  imageWidth,
  imageHeight,
  rOffset,
  gOffset,
  bOffset
) {
  const newPixelData = new Uint8ClampedArray(pixelData.length);

  // Randomize the direction for each offset.
  const rDirection = Math.random() < 0.5 ? -1 : 1;
  const gDirection = Math.random() < 0.5 ? -1 : 1;
  const bDirection = Math.random() < 0.5 ? -1 : 1;

  for (let y = 0; y < imageHeight; y++) {
    for (let x = 0; x < imageWidth; x++) {
      const idx = (y * imageWidth + x) * 4;

      // Red channel
      const rIdx =
        ((y + rDirection * rOffset) * imageWidth + (x + rDirection * rOffset)) *
        4;
      newPixelData[idx] = pixelData[rIdx] || pixelData[idx];

      // Green channel
      const gIdx =
        ((y + gDirection * gOffset) * imageWidth + (x + gDirection * gOffset)) *
        4;
      newPixelData[idx + 1] = pixelData[gIdx] || pixelData[idx + 1];

      // Blue channel
      const bIdx =
        ((y + bDirection * bOffset) * imageWidth + (x + bDirection * bOffset)) *
        4;
      newPixelData[idx + 2] = pixelData[bIdx] || pixelData[idx + 2];

      // Alpha (no change)
      newPixelData[idx + 3] = pixelData[idx + 3];
    }
  }

  // Copy newPixelData back to pixelData
  for (let i = 0; i < pixelData.length; i++) {
    pixelData[i] = newPixelData[i];
  }
}

function applyDistortion(params, pixelData) {
  if (params) {
    const [distortionPercentage, editAlpha] = params;
    console.log(
      `Distortion Percentage: ${Number(
        distortionPercentage
      )}, Edit Alpha? ${Boolean(editAlpha)}`
    );
    distortImage(pixelData, Number(distortionPercentage), Boolean(editAlpha));
  }
}

function applyWarp(params, image, pixelData) {
  if (params && params.length >= 3) {
    const numGroups = params[0];
    const maxSize = params[1];
    const uniform = params[2];
    console.log(
      `Warp Groups: ${numGroups}, MaxSize: ${maxSize}, Uniform: ${uniform}`
    );
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

function applyChaos(params, image, pixelData) {
  if (params) {
    const intensity = params;
    console.log(`Chaos Intensity: ${intensity}`);

    if (shouldApplyMethod(intensity)) {
      const distortionPercentage = randomInt(1, 100);
      console.log(`\tA sprinkle of distortion! (${distortionPercentage}%)`);
      distortImage(pixelData, distortionPercentage);
    }

    if (shouldApplyMethod(intensity)) {
      const numGroups = randomInt(1, 10);
      const maxSize = randomInt(
        1,
        Math.min(image.bitmap.width, image.bitmap.height)
      );
      const uniform = Math.random() > 0.5;
      console.log(`\tA dash of warp! (${numGroups}, ${maxSize}, ${uniform}!)`);
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
}

function applyPastel(params, pixelData) {
  if (params) {
    const intensity = params;
    console.log(`Pastel Intensity: ${intensity}`);
    pastelizeImage(pixelData, intensity);
  }
}

function applyVaporwaveHues(params, pixelData) {
  if (params) {
    const intensity = params;
    console.log(`Vaporwave Hues Intensity: ${intensity}`);
    randomizeVaporwaveHues(pixelData, intensity);
  }
}

function applyScans(params, image, pixelData) {
  if (params) {
    const [spacing, thickness, opacity] = params;
    console.log(
      `Scanlines Spacing: ${spacing}, Thickness: ${thickness}, Opacity: ${opacity}`
    );
    applyScanlines(
      pixelData,
      image.bitmap.width,
      image.bitmap.height,
      spacing,
      thickness,
      opacity
    );
  }
}

function applyVHS(params, image, pixelData) {
  if (params) {
    const [strength, frequency, direction, alpha] = params;
    console.log(
      `VHS Tracking Error Strength: ${strength}, Frequency: ${frequency}, Direction: ${direction}, Alpha: ${alpha}`
    );
    applyVHSTrackingError(
      pixelData,
      image.bitmap.width,
      image.bitmap.height,
      strength,
      frequency,
      direction,
      alpha
    );
  }
}

function applyChroma(params, image, pixelData) {
  if (params) {
    const [redOffset, greenOffset, blueOffset] = params;
    console.log(
      `Chroma Aberration Red-Offset: ${redOffset}, Green-Offset: ${greenOffset}, Blue-Offset: ${blueOffset}`
    );
    applyChromaAberration(
      pixelData,
      image.bitmap.width,
      image.bitmap.height,
      redOffset,
      greenOffset,
      blueOffset
    );
  }
}

function applyVapor(params, image, pixelData) {
  if (params) {
    const intensity = params;
    console.log(`VaporChaos Intensity: ${intensity}`);

    if (shouldApplyMethod(intensity)) {
      const pastelIntensity = randomInt(100, 100000);
      console.log(`\tA few cans of pastel! ${pastelIntensity}%`);
      pastelizeImage(pixelData, pastelIntensity);
    }

    if (shouldApplyMethod(intensity)) {
      const distortionPercentage = randomInt(1, 10);
      console.log(`\tA sprinkle of distortion! (${distortionPercentage}%)`);
      distortImage(pixelData, distortionPercentage);
    }

    if (shouldApplyMethod(intensity)) {
      const numGroups = randomInt(1, 10);
      const maxSize = randomInt(
        1,
        Math.min(image.bitmap.width, image.bitmap.height)
      );
      const uniform = Math.random() > 0.5;
      console.log(`\tA dash of warp! (${numGroups}, ${maxSize}, ${uniform}!)`);
      warpImage(
        pixelData,
        image.bitmap.width,
        image.bitmap.height,
        numGroups,
        maxSize,
        uniform
      );
    }

    if (shouldApplyMethod(intensity)) {
      const spacing = randomInt(1, 5);
      const thickness = randomInt(1, 10);
      const opacity = randomInt(50, 100);
      console.log(
        `\tA few scanlines here or there! (${spacing}, ${thickness}, ${opacity})`
      );
      applyScanlines(
        pixelData,
        image.bitmap.width,
        image.bitmap.height,
        spacing,
        thickness,
        opacity
      );
    }

    if (shouldApplyMethod(intensity)) {
      const redOffset = randomDouble(0, 10.0);
      const greenOffset = randomDouble(0, 10.0);
      const blueOffset = randomDouble(0, 10.0);
      console.log(
        `\tSome chroma aberration never hurts anyone! (${redOffset}, ${greenOffset}, ${blueOffset})`
      );
      applyChromaAberration(
        pixelData,
        image.bitmap.width,
        image.bitmap.height,
        redOffset,
        greenOffset,
        blueOffset
      );
    }
  }
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
    describe:
      "Percentage of the image to distort [distortion-percentage, editAlpha]",
    type: "array",
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
    type: "number",
  })
  .option("p", {
    alias: "pastelize",
    describe: "Strength of the pastel effect",
    type: "number",
  })
  .option("vh", {
    alias: "vaporwavehues",
    describe: "Apply vaporwave hue's [Intensity]",
    type: "number",
  })
  .option("sc", {
    alias: "scanlines",
    describe: "Arguments for scanlines: [Spacing, Thickness, Intensity]",
    type: "array",
  })
  .option("v", {
    alias: "vhs",
    describe:
      "VHS tracking error effect [strength, frequency, direction, alpha]",
    type: "array",
  })
  .option("ca", {
    alias: "chroma",
    describe:
      "Chroma Aberration effect [Red Offset, Green Offset, Blue Offset]",
    type: "array",
  })
  .option("vc", {
    alias: "vaporchaos",
    describe: "A mix of vapor and chaos, pure pandemonium! [Intensity]",
    type: "number",
  })
  .option("overwrite", {
    describe: "Overwrite the file if it already exists",
    type: "boolean",
    default: false,
  })
  .help("h")
  .alias("h", "help").argv;

(async function () {
  const sourcePath = argv.s;
  const outputPath = "PixelPandemoniumOutput";

  try {
    const sourceIsDirectory = await isDirectory(sourcePath);

    if (!sourceIsDirectory) {
      console.log(`Causing Pixel Pandemonium on ${sourcePath}!`);
      await processImage(sourcePath, outputPath);
    } else {
      try {
        await fs.mkdir(outputPath);
      } catch (mkdirError) {
        if (mkdirError.code !== "EEXIST") {
          throw mkdirError;
        }
      }

      const files = await fs.readdir(sourcePath);
      for (const file of files) {
        console.log(`Causing Pixel Pandemonium on ${file}!`);
        const inputFilePath = path.join(sourcePath, file);
        await processImage(inputFilePath, outputPath);
      }
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();

async function isDirectory(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function processImage(inputFilePath, outputPath) {
  const image = await Jimp.read(inputFilePath);
  const pixelData = image.bitmap.data;

  for (let i = 0; i < argv.r; i++) {
    applyDistortion(argv.d, pixelData);
    applyWarp(argv.w, image, pixelData);
    applyChaos(argv.c, image, pixelData);
    applyPastel(argv.p, pixelData);
    applyVaporwaveHues(argv.vh, pixelData);
    applyScans(argv.sl, image, pixelData);
    applyVHS(argv.v, image, pixelData);
    applyChroma(argv.ca, image, pixelData);
    applyVapor(argv.vc, image, pixelData);
  }

  const outputFileName =
    path.basename(inputFilePath);
  const outputFilePath = path.join(outputPath, outputFileName);

  await image.writeAsync(outputFilePath);
}

