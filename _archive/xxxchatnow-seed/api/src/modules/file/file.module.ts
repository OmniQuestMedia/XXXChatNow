import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FileController } from './controllers/file.controller';
import { FileService, VideoService } from './services';
import { ImageService } from './services/image.service';
import { File, FileSchema } from './schemas';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: File.name,
        schema: FileSchema
      }
    ])
  ],
  providers: [FileService, ImageService, VideoService],
  controllers: [FileController],
  exports: [FileService, ImageService, VideoService]
})
export class FileModule { }
