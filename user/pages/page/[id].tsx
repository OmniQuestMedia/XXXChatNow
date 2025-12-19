import PageHeader from '@components/common/layout/page-header';
import SeoMetaHead from '@components/common/seo-meta-head';
import { postService } from '@services/post.service';
import { IPost } from 'src/interfaces';
import { redirect } from 'src/lib';

interface Props {
  post: IPost
}

function PostDetail({
  post
}: Props) {
  return (
    <div className="page-container">
      <SeoMetaHead
        item={post}
        canonical={`/page/${post.slug}`}
        description={post.metaDescription}
        pageTitle={post.metaTitle}
        keywords={post.metaKeyword}
      />
      <PageHeader title={post.title} />
      <div
        className="page-content sun-editor-editable"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}

PostDetail.authenticate = false;

PostDetail.getInitialProps = async (ctx) => {
  try {
    const { id } = ctx.query;
    const resp = await postService.findById(id);
    return {
      post: resp.data
    };
  } catch (e) {
    return redirect('/404', ctx);
  }
};

export default PostDetail;
