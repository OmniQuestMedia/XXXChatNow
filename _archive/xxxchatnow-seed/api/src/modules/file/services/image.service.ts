import { existsSync } from 'fs';
import * as sharp from 'sharp';
import { WatermarkOptions } from 'src/modules/performer/inteface';

export class ImageService {
  public async createThumbnail(
    filePath: string,
    options?: {
      width?: number;
      height?: number;
      toPath?: string;
    }
  ): Promise<sharp.OutputInfo | Buffer> {
    // eslint-disable-next-line no-param-reassign
    options = options || {
      width: 200, // TODO - from config
      height: 200
    };
    // if (file.mimeType && !file.mimeType.includes('image')) {
    //   throw new InvalidImageException();
    // }

    if (options.toPath) {
      return sharp(filePath)
        .rotate()
        .resize(options.width, options.height)
        .toFile(options.toPath);
    }

    return sharp(filePath)
      .rotate()
      .resize(options.width, options.height)
      .toBuffer();
  }

  public async getMetaData(filePath: string) {
    return sharp(filePath).metadata();
  }

  public async replaceWithoutExif(filePath: string) {
    return sharp(filePath).rotate().toBuffer();
  }

  public async addWatermark(
    filePath: string | Buffer,
    options = {} as WatermarkOptions
  ) {
    const item = sharp(filePath).rotate();
    const metadata = await item.metadata();

    const { type } = options;

    if (type === 'text') {
      const { align, left, top, bottom, fontSize, opacity, color, text } = options;
      let textX: string | number = '50%';
      let textY: string | number = '50%';
      switch (align) {
        case 'middle':
          textX = '50%';
          textY = '50%';
          break;
        case 'top':
          textX = left;
          textY = top;
          break;
        default:
          textX = left;
          textY = metadata.height - bottom;
          break;
      }
      // font size need to be resized with standard size (1080px of width)
      const newFontsize = Math.round((fontSize * metadata.width) / 1080);
      const textedSVG =
        Buffer.from(`<svg viewBox="0 0 ${metadata.width} ${metadata.height}">
          <rect x="0" y="0" width="10%" height="100%" fill="none" stroke="none" />
          <text x="${textX}" y="${textY}" font-size="${newFontsize}" fill="${color}" fill-opacity="${opacity}">${text}</text>
        </svg>`);
      item.composite([
        {
          input: textedSVG
        }
      ]);
    }

    if (type === 'image') {
      if (existsSync(options.filePath)) {
        const watermarkItem = sharp(options.filePath).rotate();
        const watermarkMetadata = await watermarkItem.metadata();
        const watermarkHeight = Math.round(metadata.height / 10);
        const watermarkWidth = Math.round(
          watermarkMetadata.width * (watermarkHeight / watermarkMetadata.height)
        );
        const watermarkFile = await sharp(options.filePath)
          .resize(watermarkHeight, watermarkWidth)
          .toBuffer();
        item.composite([
          {
            input: watermarkFile,
            gravity: 'southeast'
          }
        ]);
      }
    }
    return item.toBuffer();
  }
}
