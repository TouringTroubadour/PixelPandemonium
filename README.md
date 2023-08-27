![Pixel Pandemonium Banner](./res/PixelPandemonium.jpg)

# PixelPandemonium

A powerful tool to unleash controlled chaos on your images. Distort, warp, or introduce randomness to create unique outputs with each run.

### Usage

```bash
PixelPandemonium.exe -s <path-to-image> [options]
```

### Options

- **-s, --source [path]**: _Required._ Path to the source image you want to process.

- **-d, --distortion [percentage]**: Percentage of distortion you want to introduce to the image.

- **-w, --warp [number-of-groups max-group-size uniform]**:

  - _number-of-groups_ specifies how many groups of rows or columns you want to shift.
  - _max-group-size_ defines the maximum size for a group. If the `uniform` flag is set to true, all warp groups will be of this size. Otherwise, the size will be random.
  - _uniform_ is a boolean (`true` or `false`) indicating whether all warp groups should be of uniform size.

- **-c, --chaos [percentage]**: Apply a random distortion and warping to the image.

- **-p, --pastelize [percentage]**: Apply a pastel effect to the image.

- **--vh, --vaporwavehues [Intensity]**: Apply a vaporwave-esque hue to the image.

- **--sc, --scanlines [spacing thickness]**:
   -_spacing_ specifies the spacing between scanlines.
   -_thickness_ specifies the thickness of scanlines.

- **--v, --vhs [strength frequency direction alpha]**:
   -_strength_ specifies the wave amplitude.
   -_frequency_ specifies the wave frequency.
   -_direction_ specifies whether the waves will be horizontal, vertical, or both.
   -_alpha_ was supposed to determine the opacity of the waves, but instead does something chaotic.

- **--ca, --chroma [red-offset green-offset blue-offset]**:
   -_red-offset_ specifies the offset of red pixels.
   -_green-offset_ specifies the offset of green pixels.
   -_blue-offset_ specifies the offset of blue pixels.

- **--vc, --vaporchaos [percentage]**: Apply a random assortment of Chaos and Vapor effects.

- **-r, --repeat [number]**: Apply all the specified distortions recursively for the provided number of times.

### Examples

1. Distort an image by 30%:

   ```bash
   PixelPandemonium.exe -s image.jpg -d 30
   ```

2. Introduce chaos (a mixture of warp and distortion):

   ```bash
   PixelPandemonium.exe -s image.jpg -c
   ```

3. Warp an image with 5 groups of a max size of 20 pixels each, with random group sizes:

   ```bash
   PixelPandemonium.exe -s image.jpg -w 5 20 false
   ```

4. Warp an image with 5 uniform groups of size 20 pixels:

   ```bash
   PixelPandemonium.exe -s image.jpg -w 5 20 true
   ```

5. Apply a distortion of 20% recursively 3 times:

   ```bash
   PixelPandemonium.exe -s image.jpg -d 20 -r 3
   ```

---

Use `PixelPandemonium.exe --help` for more information on the available commands and options.

## Installation and Setup

### Retrieving the Executable

1. Navigate to the `bin` directory of the repository or distribution package.
2. Look for the `PixelPandemonium` executable (`PixelPandemonium.exe` for Windows).

### Adding to PATH for Easy Access

Depending on your operating system, the method to add `PixelPandemonium` to your PATH varies:

- **Windows**:

  1. Right-click on `This PC` or `Computer` on the desktop or in File Explorer.
  2. Click `Properties`.
  3. Choose `Advanced system settings` on the left.
  4. Select `Environment Variables`.
  5. In the System Variables section, find and select the `Path` variable. Click `Edit`.
  6. In the Edit window, click `New` and paste the full path to the directory where you saved the executable.

- **macOS and Linux**:

  1. Open a terminal.
  2. Edit your shell's profile script (e.g., `~/.bashrc`, `~/.zshrc`, etc.) with a text editor of your choice, like `nano` or `vim`.
  3. Add the following line to the end of the file, replacing `/path/to/directory` with the full path to the directory where you saved the executable:

  ```bash
  export PATH="$PATH:/path/to/directory"
  ```

  4. Save the file and close the editor.
  5. Reload your profile script (e.g., `source ~/.bashrc` or `source ~/.zshrc`).

After adding the executable to your PATH, you can invoke WARP from any location in your terminal or console.

---

## Libraries Used

`PixelPandemonium` leverages powerful third-party libraries to achieve its functionality with efficiency and ease.

### Jimp

**[Jimp](https://github.com/oliver-moran/jimp)** is an image processing library written entirely in JavaScript for Node. It allows for image manipulation without relying on external software.

**Usage in PixelPandemonium:**
Jimp is our primary tool for image reading, writing, and direct pixel manipulation. The distortion and warping functions heavily utilize Jimp's ability to access and modify individual pixels, making the transformations possible.

**Key Features:**

- Fully written in JavaScript, no native bindings or dependencies.
- Allows for manipulation of image data directly.
- Supports multiple image formats (PNG, JPEG, BMP, etc.).

### Yargs

**[Yargs](https://yargs.js.org/)** is a command-line argument parser that makes it easy to build interactive command-line tools. It parses arguments and generates an elegant user interface.

**Usage in PixelPandemonium:**
Yargs is responsible for the user-friendly command-line interface (CLI) of PixelPandemonium. It parses user inputs, validates them, and provides interactive help messages. The options such as `-s`, `-r`, `-d`, `-w`, and `-c` are all parsed and managed by Yargs.

**Key Features:**

- Dynamic generation of help messages.
- Supports command grouping, aliases, and default values.
- Handles argument validation and error messages.

---

## The Boring Stuff (License)

MIT License

Copyright (c) [2023]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
