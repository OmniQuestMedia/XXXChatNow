/* eslint-disable jsx-a11y/no-static-element-interactions */
import PageHeader from '@components/common/layout/page-header';
import PageTitle from '@components/common/page-title';
import SeoMetaHead from '@components/common/seo-meta-head';
import PerformerGrid from '@components/performer/performer-grid';
import { redirect } from '@lib/utils';
import {
  searchPerformer,
  updatePerformerFavourite
} from '@redux/performer/actions';
import { featuredCreatorPackageService } from '@services/featured-creator-package.service';
import { Typography } from 'antd';
import { debounce } from 'lodash';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  IPerformerCategogies,
  IPerformSearch,
  IResponse
} from 'src/interfaces';
import { updateUIValue } from 'src/redux/ui/actions';
import { performerCategories } from 'src/services/perfomer-categories.service';
import { SocketContext } from 'src/socket';

const { Paragraph } = Typography;

const mapStates = (state) => ({
  loggedIn: state.auth.loggedIn,
  data: state.performer.performers,
  pluralTextModel: state.ui.pluralTextModel
});
const mapDispatch = {
  dispatchSearchPerformer: searchPerformer,
  updatePerformerFavourite,
  updateUIValue
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

type IProps = {
  category: any;
  tag: string;
};

function ModelSearchPage({
  data,
  category,
  tag,
  pluralTextModel,
  dispatchSearchPerformer
}: IProps & PropsFromRedux) {
  const initQueryState: IPerformSearch = {
    offset: 0,
    limit: 60,
    gender: '',
    category: '',
    country: '',
    tag,
    sortBy: '',
    sort: 'desc'
  };
  const [ellipsis, setEllipsis] = useState(true);
  const [featuredList, setFeaturedList] = useState<Record<string, any>>({});
  const { socketStatus, connected, getSocket } = useContext(SocketContext);
  const router = useRouter();

  let pageTitle = `Vip ${pluralTextModel || 'Performers'}`;
  if (category) {
    pageTitle = category.name;
  }

  const [query, setQuery] = useState(initQueryState);

  const setFilter = (name: string, value: any) => {
    setQuery({
      ...query,
      [name]: value
    });
  };

  const search = debounce(() => {
    dispatchSearchPerformer({
      ...query,
      category: category ? category._id : '',
      tags: tag || '',
      ...router.query
    });
  }, 100);

  const handleSocketConnect = () => {
    const socket = getSocket();
    if (socket) {
      // TODO - recheck this logi
      socket.on('modelUpdateStatus', search);
      socket.on('modelUpdateStreamingStatus', search);
    }
  };

  const handleSocketDisconnect = () => {
    const socket = getSocket();
    if (socket) {
      socket.off('modelUpdateStatus', search);
      socket.off('modelUpdateStreamingStatus', search);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await featuredCreatorPackageService.getApprovedFeatureCreatorListings({ limit: 100 });
        const result = res.data.data.reduce((obj, value) => ({
          ...obj,
          [value.packageId]: {
            name: value.package.name,
            performers: obj[value.packageId]
              ? [...obj[value.packageId].performers, value.performer]
              : [value.performer]
          }
        }), {});
        setFeaturedList(result);
      } catch (e) {
        // error
      }
    })();
  }, []);

  useEffect(() => {
    if (!connected()) return handleSocketDisconnect();

    handleSocketConnect();

    return handleSocketDisconnect;
  }, [socketStatus]);

  useEffect(() => {
    search();
  }, [category, tag, router.query]);

  useEffect(() => {
    (async () => {
      try {
        const res = await featuredCreatorPackageService.getApprovedFeatureCreatorListings({ limit: 100 });
        const result = res.data.data.reduce((obj, value) => ({
          ...obj,
          [value.packageId]: {
            name: value.package.name,
            performers: obj[value.packageId]
              ? [...obj[value.packageId].performers, value.performer]
              : [value.performer]
          }
        }), {});
        setFeaturedList(result);
      } catch (e) {
        // error
      }
    })();
  }, []);

  const myHTML = category?.description || '';
  const strippedHtml = myHTML.replace(/<[^>]+>/g, '');
  const start = strippedHtml.slice(0, strippedHtml.length - 250).trim();

  return (
    <>
      {category
        ? (
          <SeoMetaHead
            item={category}
            canonical={`/category/${category.slug}`}
            description={category.metaDescription}
            pageTitle={category.metaTitle}
            keywords={category.metaKeyword}
          />
        )
        : <PageTitle title={pageTitle} />}
      <PageHeader
        title={pageTitle}
        footer={(
          <>
            <Paragraph ellipsis={ellipsis}>
              {start}
              <span>
                {!ellipsis && (
                  <span>
                    ...
                    <a onClick={() => setEllipsis(true)}>Show less</a>
                  </span>
                )}
              </span>
            </Paragraph>
            <span>{strippedHtml.length > 250 && ellipsis && <a onClick={() => setEllipsis(false)}>Show more</a>}</span>
          </>
        )}
      />
      <div
        id="category-description"
        className="hidden"
        dangerouslySetInnerHTML={{ __html: category?.description }}
      />

      {Object.keys(featuredList).map((key) => (
        <div key={key} className="my-8">
          <PerformerGrid
            title={featuredList[key].name}
            isPage
            success
            data={featuredList[key].performers}
            total={featuredList[key].performers.length}
          />
        </div>
      ))}

      <div className="">
        <PerformerGrid
          {...data}
          {...query}
          isPage
          setFilter={setFilter}
        />
      </div>
    </>
  );
}

ModelSearchPage.getInitialProps = async (ctx) => {
  const { tag, category } = ctx.query;
  if (!category) {
    return {
      tag
    };
  }

  try {
    const resp: IResponse<IPerformerCategogies> = await performerCategories.details(
      ctx.query.category
    );

    return {
      category: resp.data,
      tag
    };
  } catch (err) {
    redirect('/404', ctx);
    return null;
  }
};

export default connector(ModelSearchPage);
