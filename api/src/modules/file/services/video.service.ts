import { spawn } from 'child_process';
import * as Ffmpeg from 'fluent-ffmpeg';
import { existsSync } from 'fs';
import { join } from 'path';
import { StringHelper } from 'src/kernel';
import { getExt } from 'src/kernel/helpers/string.helper';
import { cpus } from 'os';
import { WatermarkOptions } from 'src/modules/performer/inteface';
import { ConvertMp4ErrorException } from '../exceptions';

export interface IConvertOptions {
  toPath?: string;
  size?: string; // https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#video-frame-size-options
  watermark?: WatermarkOptions;
}

export interface IConvertResponse {
  fileName: string;
  toPath: string;
}

export class VideoService {
  // limit threads of ffmpeg
  private getThreadsLimit() {
    const cpuCount = cpus().length;
    const defaultNum = Math.ceil(cpuCount / 2);

    if (process.env.FFMPEG_CPU_LIMIT) {
      const num = parseInt(process.env.FFMPEG_CPU_LIMIT, 10);
      if (num > cpuCount) return defaultNum;
      if (num < 1) return 1;
    }
    return defaultNum;
  }

  public async convert2Mp4(
    filePath: string,
    options = {} as IConvertOptions
  ): Promise<IConvertResponse> {
    try {
      const fileName = `${StringHelper.randomString(5)}_${StringHelper.getFileName(filePath, true)}.mp4`;
      const toPath = options.toPath || join(StringHelper.getFilePath(filePath), fileName);
      const threads = this.getThreadsLimit();
      return new Promise((resolve, reject) => {
        // have error, we have to build manually command line
        // eslint-disable-next-line new-cap
        // const command = new ffmpeg(filePath)
        //   // set target codec
        //   .videoCodec('libx264')
        //   // .addOption('-vf', 'scale=2*trunc(iw/2):-2')
        //   // QuickTime compatibility, Note: Requires dimensions to be divisible by 2.
        //   .outputOptions('-pix_fmt yuv420p')
        //   // All device compatibility, Android in particular doesn't support higher profiles.
        //   .outputOptions('-profile:v baseline -level 3.0')
        //   // Quality 0 is lossless, 23 is default, and 51 is worst possible. 18-28 is a sane range.
        //   // .outputOptions('-crf 20')
        //   // Fast start, Moves some data to the beginning of the file, allowing the video to be played before it is completely downloaded.
        //   .outputOptions('-movflags +faststart')
        //   .outputOptions('-strict experimental')
        //   // compress file: ultrafast, superfast, veryfast, fast, medium, slow, slower, veryslow
        //   .outputOptions('-preset fast')
        //   // Faster processing Flag: -threads 0, Allow your CPU to use an optimal number of threads.
        //   .outputOptions('-threads 0')
        //   .on('end', () => resolve({
        //     fileName,
        //     toPath
        //   }))
        //   .on('error', reject)
        //   .toFormat('mp4');

        // if (options.size) {
        //   command.size(options.size);
        // }
        // // save to file
        // command.save(toPath);

        let outputOptions = `-vcodec libx264 -pix_fmt yuv420p -profile:v baseline -level 3.0 -movflags +faststart -strict experimental -preset fast -threads ${threads} -crf 23`;
        if (options.size) {
          const sizes = options.size.split('x');
          const width = sizes[0];
          // retain aspect ratio just give height as -1 and it will automatically resize based on the width
          const height = sizes.length > 1 ? sizes[1] : '-1  ';
          outputOptions += ` -vf scale="${width}:${height}"`;
        }

        if (options.watermark) {
          const { type } = options.watermark;
          if (type === 'text') {
            const {
              text,
              color = '#ffffff',
              fontSize = 24,
              opacity = 1,
              bottom = 10,
              top = 20,
              left = 10,
              align = 'top' // support top, middle, bottom only
            } = options.watermark;
            let textPos = 'x=(w-text_w)/2:y=(h-text_h)/2'; // middle
            // center x=(w-text_w)/2:y=(h-text_h)/2
            switch (align) {
              case 'bottom':
                textPos = `x=${left}:y=H-th-${bottom}`;
                break;
              case 'top':
                textPos = `x=${left}:y=${top}`;
                break;
              default:
                break;
            }

            const fontfile = join(
              __dirname,
              '..',
              '..',
              '..',
              '..',
              'fonts',
              'montserrat.ttf'
            );
            outputOptions += ` -vf drawtext=text='${text}':${textPos}:fontsize=${fontSize}:fontfile=${fontfile}:fontcolor=${color}@${opacity}`;
          }

          if (type === 'image') {
            if (
              options.watermark.filePath &&
              existsSync(options.watermark.filePath)
            ) {
              // use image
              // input of watermark must be first
              // center of video
              // outputOptions = `-i ${watermarkFile} -filter_complex "overlay=W-w-10:H-h-10" ${outputOptions}`;
              // [1]colorchannelmixer=aa=0.5,scale=iw*0.1:-1[wm] // opacity to 50%
              // bottom right
              // outputOptions = `-i ${options.watermark.filePath} -filter_complex "[1]scale=iw*0.1:-1[wm];[0][wm]overlay=x=(main_w-overlay_w):y=(main_h-overlay_h)" ${outputOptions}`;

              outputOptions = `-i ${options.watermark.filePath} -filter_complex "overlay=W-w-10:H-h-10" ${outputOptions}`;
            }
          }
        }

        const q = `ffmpeg -i ${filePath} ${outputOptions} ${toPath}`;
        // use spawn, avoid exception buffer when it is more than 200KB
        const command = spawn(q, [], {
          shell: true,
          // stdin, stdout, stderr
          stdio: ['ignore', 'ignore', 'pipe']
        });
        let e = '';
        command.stderr.on('data', (data) => {
          e += data;
        });
        command.on('exit', (code) => {
          if (!code) {
            resolve({
              fileName,
              toPath
            });
            return;
          }
          reject(new Error(e));
        });
      });
    } catch (e) {
      throw new ConvertMp4ErrorException(e);
    }
  }

  public async getMetaData(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      Ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        return resolve(metadata);
      });
    });
  }

  public async getDuration(filePath: string): Promise<number> {
    // eslint-disable-next-line
    return new Promise((resolve, reject) => Ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    }));
  }

  public async createThumbs(
    filePath: string,
    options: {
      toFolder: string;
      count?: number;
      size?: string;
    }
  ): Promise<string[]> {
    let thumbs = [];
    // eslint-disable-next-line
    return new Promise((resolve, reject) => Ffmpeg(filePath)
      .on('filenames', (filenames) => {
        thumbs = filenames;
      })
      .on('end', () => {
        resolve(thumbs);
      })
      .on('error', reject)
      .screenshot({
        folder: options.toFolder,
        filename: `${StringHelper.randomString(5)}-%s.png`,
        count: options.count || 3,
        size: options.size || '320x240'
      }));
  }

  /**
   * check if this video support html5, we don't need to convert to h264 if any?
   * @param filePath
   * @returns
   */
  public async isSupportHtml5(filePath: string) {
    // get file name
    const ext = getExt(filePath);
    if (!ext || !['.mp4', 'mp4', '.webm', 'webm', '.ogg', 'ogg'].includes(ext.toLocaleLowerCase())) return false;

    const meta = await this.getMetaData(filePath);
    if (!meta?.streams?.length) return false;
    const videoStream = meta.streams.find((s) => s.codec_type === 'video');

    // TODO - check if pix_fmt: 'yuv420p'
    return ['h264', 'vp8'].includes(videoStream.codec_name);
  }
}
