import AggregatorFilter from '@components/cam-aggregator/aggregator-filter';
import PerformerGrid from '@components/performer/performer-grid';
import { capitalizeFirstLetter } from '@lib/string';
import {
  updatePerformerFavourite
} from '@redux/performer/actions';
import { camAggregatorService } from '@services/cam-aggregator.service';
import { debounce } from 'lodash';
import dynamic from 'next/dynamic';
import Router, { NextRouter, withRouter } from 'next/router';
import {
  useContext, useEffect, useState
} from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { IBanner } from 'src/interfaces';
import { bannerService, settingService } from 'src/services';
import { SocketContext } from 'src/socket';

const SeoMetaHead = dynamic(() => import('@components/common/seo-meta-head'));
const AggregatorProfileGridCard = dynamic(() => import('@components/cam-aggregator/grid-card'));

const mapStates = (state: any) => ({
  countries: state.settings.countries,
  loggedIn: state.auth.loggedIn,
  settings: state.settings,
  performers: state.performer.performers
});

const mapDispatch = {
  dispatchUpdatePerformerFavorite: updatePerformerFavourite
};

const connector = connect(mapStates, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

type PopsMeta = {
  homeTitle: string;
  metaKeywords: string;
  metaDescription: string;
  banners: IBanner[];
};

type PropsWithRouter = {
  router: NextRouter;
}

function Cams({
  metaKeywords,
  metaDescription,
  banners,
  countries,
  router,
  homeTitle
}: PopsMeta & PropsFromRedux & PropsWithRouter) {
  const initQueryState = {
    offset: 0,
    limit: 60,
    gender: '',
    category: '',
    country: '',
    sortBy: '',
    sort: 'desc'
  };
  const { socketStatus, connected, getSocket } = useContext(SocketContext);
  const [filterQuery, setFilterQuery] = useState(initQueryState);
  const [camCategories, setCamCategories] = useState([]);
  const [camData, setCamData] = useState({
    total: 0,
    data: []
  });

  const search = debounce(async (params = {}) => {
    const resp = await camAggregatorService.online({
      // ...filterQuery,
      ...params
    });
    setCamData(resp.data);
  }, 50);

  const setFilter = (name: string, value: any) => {
    if (name === 'category') {
      Router.push(`/cams-aggregator/category/${value}`);
      return;
    }

    setFilterQuery({
      ...filterQuery,
      [name]: value,
      ...(name !== 'offset' && { offset: 0 })
    });
  };

  const clearFilter = () => {
    setFilterQuery(initQueryState);
    Router.push('/cams-aggregator/category');
  };

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

  const loadCamCategories = async () => {
    const resp = await camAggregatorService.categories({});
    setCamCategories(resp.data);
  };

  useEffect(() => {
    if (!connected()) return handleSocketDisconnect();

    handleSocketConnect();

    return handleSocketDisconnect;
  }, [socketStatus]);

  // useEffect(() => {
  //   search(router.query);
  // }, [router.query]);

  useEffect(() => {
    const query = filterQuery;
    Object.keys(router.query).forEach((key) => {
      query[key] = router.query[key];
    });
    if (!router.query.category) query.category = '';

    search(query);
  }, [filterQuery, router.query]);

  useEffect(() => {
    loadCamCategories();
  }, []);

  return (
    <div className="homepage">
      <SeoMetaHead
        pageTitle={homeTitle}
        description={metaDescription}
        keywords={metaKeywords}
      />
      <AggregatorFilter
        categories={camCategories}
        countries={countries}
        setFilter={setFilter}
        clearFilter={clearFilter}
        {...filterQuery}
      />
      <PerformerGrid
        title={capitalizeFirstLetter(homeTitle)}
        isPage
        success
        banners={banners}
        setFilter={setFilter}
        data={camData.data}
        total={camData.total}
        renderGridCard={({ performer }) => <AggregatorProfileGridCard key={performer._id} performer={performer} className="performer-box performer-box-4-item" />}
        {...filterQuery}
      />
    </div>
  );
}

Cams.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const [metaSettings, bannerResp, category] = await Promise.all([
      settingService.valueByKeys(['metaKeywords', 'metaDescription', 'homeTitle']),
      bannerService.search(),
      query.category && camAggregatorService.findOne(query.category)
    ]);
    const meta = metaSettings.data;

    return {
      homeTitle: category?.data?.metaTitle || category?.data.name || meta.homeTitle || 'Live cams',
      metaKeywords: category?.data?.metaKeywords || meta.metaKeywords || '',
      metaDescription: category?.data?.metaDescription || meta.metaDescription || '',
      banners: bannerResp.data?.data || []
    };
  } catch (e) {
    return {
      homeTitle: '',
      metaKeywords: '',
      metaDescription: '',
      banners: []
    };
  }
};

export default connector(withRouter(Cams));
