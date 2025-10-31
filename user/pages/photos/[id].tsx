import 'react-responsive-carousel/lib/styles/carousel.min.css';

import SeoMetaHead from '@components/common/seo-meta-head';
import {
  List,
  message
} from 'antd';
import dynamic from 'next/dynamic';
import nextCookie from 'next-cookies';
import { useEffect, useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { IPerformerGallery, IPhoto } from 'src/interfaces';
import { capitalizeFirstLetter, getResponseError, redirect } from 'src/lib';
import { galleryService, photoService } from 'src/services';

import style from './index.module.less';

const ListItem = dynamic(() => import('@components/common/base/list-item'));
const Loader = dynamic(() => import('@components/common/base/loader'));
const NumberFormat = dynamic(() => import('@components/common/layout/numberformat'));
const PageHeader = dynamic(() => import('@components/common/layout/page-header'));

interface IProps {
  data: IPerformerGallery;
}

function PhotosPages({ data }: IProps) {
  const [photos, setPhotos] = useState<IPhoto[]>([]);
  const [totalPhoto, setTotalPhoto] = useState(0);
  const [searching, setSearching] = useState(false);
  const [limit] = useState(12);
  const [offset, setOffset] = useState(0);
  const [selectedItem, setSelectedItem] = useState(0);
  const [success] = useState(true);
  const [loading] = useState(false);

  const {
    name, description, token, isSale, numOfItems
  } = data;
  const dataSource = [
    {
      title: 'Name',
      description: name
    },
    { title: 'Description', description },
    { title: 'Photos', description: numOfItems },
    { title: 'Price', description: !isSale ? 'Free' : <NumberFormat value={token} suffix=" tokens" /> }
  ];

  const responseError = async (e) => {
    const err = await Promise.resolve(e);
    message.error(getResponseError(err));
  };

  const getPhotosByGallery = async () => {
    try {
      setSearching(true);
      const resp = await photoService.searchByGallery(data._id, {
        limit,
        offset
      });

      setPhotos(resp.data.data);
      setTotalPhoto(resp.data.total);
    } catch (error) {
      responseError(error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    getPhotosByGallery();
  }, []);

  const loadMore = async (index: number) => {
    const position = index + 1;
    if (position !== photos.length) return;

    const hasMore = photos.length < totalPhoto;
    if (hasMore) {
      try {
        const result = limit + offset;
        const resp = await photoService.searchByGallery(data._id, {
          limit,
          offset: result
        });
        setPhotos([...photos, ...resp.data.data]);
        setOffset(result);
      } catch (error) {
        responseError(error);
      } finally {
        setSearching(false);
      }
    }
  };
  return (
    <div className="photo-page">
      <SeoMetaHead item={data} canonical={`/photos/${data._id}`} />
      <PageHeader
        title={`${capitalizeFirstLetter(name)} Gallery`}
      />
      {success && !loading && (
      <div className={style['photo-carousel-content']}>
        {searching && (<Loader spinning fullScreen={false} />)}
        <Carousel
          dynamicHeight
          onClickItem={(index) => setSelectedItem(index + 1)}
          selectedItem={selectedItem}
          onChange={loadMore.bind(this)}
          showIndicators
          swipeable
        >
          {photos.map((p) => (
            <div key={p._id}>
              <img
                alt=""
                src={p.photo.url}
                style={{ objectFit: 'contain' }}
              />
              <p className="legend">{p.title}</p>
            </div>
          ))}
        </Carousel>
        <List
          dataSource={dataSource}
          renderItem={(item) => (
            <ListItem description={item.description} title={item.title} />
          )}
        />
      </div>
      )}

    </div>
  );
}

PhotosPages.authenticate = false;
PhotosPages.layout = 'public';
PhotosPages.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    if (query.data) return { data: JSON.parse(query.data) };
    if (query.id) {
      const { token } = nextCookie(ctx);
      const headers = { Authorization: token };
      const resp = await galleryService.publicdetails(query.id, headers);
      return {
        data: resp.data
      };
    }
    return {};
  } catch {
    return redirect('/404', ctx);
  }
};

export default PhotosPages;
