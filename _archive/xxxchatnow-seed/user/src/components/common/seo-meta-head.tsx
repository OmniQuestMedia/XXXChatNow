import { isUrl } from '@lib/string';
import { truncate } from 'lodash';
import Head from 'next/head';
import { connect, ConnectedProps } from 'react-redux';

export interface ISeoMetaHeadProps {
  item?: any;
  imageUrl?: string;
  pageTitle?: string;
  keywords?: string | Array<string>;
  description?: string;
  canonical?: string;
  canonicalLink?: string;
}

const mapStates = (state: any) => ({
  ui: state.ui,
  userUrl: state.settings.userUrl
});

const connector = connect(mapStates);

type PropsFromRedux = ConnectedProps<typeof connector>;

function SeoMetaHead({
  ui,
  userUrl,
  item = null,
  imageUrl = '',
  pageTitle = '',
  keywords = '',
  description = '',
  canonical = null,
  canonicalLink = null
}: PropsFromRedux & ISeoMetaHeadProps) {
  const itemTitle = item?.title || item?.name || item?.username;
  const title = pageTitle || `${pageTitle || itemTitle || ''} | ${ui.siteName} `;
  let metaKeywords = keywords;
  if (Array.isArray(keywords)) metaKeywords = keywords.join(',');
  const metaDescription = truncate(description || item?.description || item?.bio || item?.name || '', {
    length: 250
  });
  let newCanonicalLink = canonicalLink;
  if (!canonicalLink && canonical && isUrl(userUrl)) {
    const url = new URL(canonical, userUrl);
    newCanonicalLink = url.href;
  } else if (!canonicalLink && canonical) {
    newCanonicalLink = canonical;
  }

  return (
    <Head>
      <title>{title}</title>
      {metaKeywords && <meta name="keywords" content={metaKeywords as string} />}
      {metaDescription && <meta name="description" content={metaDescription} />}

      <meta property="og:title" content={title} key="title" />
      {imageUrl && <meta property="og:image" content={imageUrl || ''} />}
      <meta property="og:keywords" content={metaKeywords as string} />
      {metaDescription && <meta property="og:description" content={metaDescription} />}
      <meta name="twitter:title" content={title} />
      {imageUrl && <meta name="twitter:image" content={imageUrl || ''} />}
      {metaDescription && <meta name="twitter:description" content={metaDescription} />}
      {newCanonicalLink && <link rel="canonical" href={newCanonicalLink} />}
      {newCanonicalLink && <meta name="og:link" content={newCanonicalLink} />}
    </Head>
  );
}

export default connector(SeoMetaHead);
