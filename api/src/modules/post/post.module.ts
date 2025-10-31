import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { PostService, CategoryService, PostSearchService } from './services';
import {
  PostController,
  AdminCategoryController,
  AdminPostController
} from './controllers';
import { UserModule } from '../user/user.module';
import {
  Category,
  CategorySchema,
  Post,
  PostMeta,
  PostMetaSchema,
  PostSchema
} from './schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Post.name,
        schema: PostSchema
      },
      {
        name: PostMeta.name,
        schema: PostMetaSchema
      },
      {
        name: Category.name,
        schema: CategorySchema
      }
    ]),
    // inject user module because we request guard from auth, need to check and fix dependencies if not needed later
    UserModule,
    forwardRef(() => AuthModule)
  ],
  providers: [
    PostService,
    CategoryService,
    PostSearchService
  ],
  controllers: [
    PostController,
    AdminCategoryController,
    AdminPostController
  ],
  exports: [PostService, CategoryService, PostSearchService]
})
export class PostModule { }
