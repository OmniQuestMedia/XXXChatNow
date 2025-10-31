/* eslint-disable no-useless-escape */
/* eslint-disable jsx-a11y/iframe-has-title */
/* eslint-disable react/no-danger */
/* eslint-disable dot-notation */
import AggregatorProfileGridCard from '@components/cam-aggregator/grid-card';
import SeoMetaHead from '@components/common/seo-meta-head';
import PerformerGrid from '@components/performer/performer-grid';
import VideoPlayer from '@components/videos/video-player';
import { backToTop } from '@lib/layout';
import { redirect404 } from '@lib/utils';
import { camAggregatorService } from '@services/cam-aggregator.service';
import {
  Button,
  Col, ColProps, message, Row
} from 'antd';
import Title from 'antd/lib/typography/Title';
import Link from 'next/link';
import Router from 'next/router';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import {
  IResponse
} from 'src/interfaces';
import { IAggregatorCams } from 'src/interfaces/aggregator';

import style from './details.module.less';

interface IProps {
  performer: any;
}

function CamDetails({
  performer
}: IProps) {
  const [relatedCams, setRelatedCams] = useState([]);

  const getRelatedCams = async () => {
    try {
      const resp = await camAggregatorService.related(performer.username);
      setRelatedCams(resp.data);
      // eslint-disable-next-line
    } catch { }
  };

  const _renderIframe = (service: string, iframe: string) => {
    if (service === 'stripcash') {
      return <VideoPlayer src={performer.iframe} />;
    } if (service === 'xlovecam') {
      return (
        <div style={{ width: '100%' }}>
          <div id="domToInjectTheWidgetb903c2f5x06" />
          <Script src="//www.xlovecam.com/js/ads.js" />
          <Script>{`if (promotoolWidget === undefined) {var promotoolWidget = document.createElement("script");promotoolWidget.setAttribute("type", "text/javascript");promotoolWidget.setAttribute("src", "https://prm03.wlresources.com/static/js/app/widget.js?" + new Date().toJSON().slice(0,10).split(\'-\').join(\'\'));document.head.appendChild(promotoolWidget);}window.addEventListener("XlovepromotoolInit", function(event){var config = {"ui":{"id_affilie":"24254","cf":"990000","caf":"7c747c7d","cac":"fff","tlt":"7f0000","cc":"990000","ct":"fff","ca":"99000082","psm": "${performer.username}","iframeVersion":false,"displayLogo":false,"quickFilters":false,"topLinks":true,"modelSuggestion":false,"textChat":true,"linkNewPage":false,"tri":10},"domId":"domToInjectTheWidgetb903c2f5x06","resourcesUrl":"https://s1.wlresources.com","promotoolUrl":"https://prm03.wlresources.com","cacheBuster":"2656964"};Xlovepromotool.WidgetFactory.create("LiveChat", config).init();});`}</Script>
        </div>
      );
    }

    let newSrc = iframe;
    if (/(<([^>]+)>)/i.test(iframe)) {
      const matches = iframe.match(/\bhttps?:\/\/\S+/gi);
      if (!matches.length) return null;
      // eslint-disable-next-line prefer-destructuring
      newSrc = matches[0];
    }

    return (
      <>
        {service === 'xlovecam' ? <h3>Image from webcam</h3> : null}
        <iframe src={newSrc} className="iframe-container" />
      </>
    );
  };

  const _renderRelatedCams = (colProps?: ColProps) => (
    <Row>
      <PerformerGrid
        total={relatedCams.length}
        data={relatedCams}
        success
        searching={false}
        renderGridCard={({ performer: p }) => (
          <Col xs={12} md={6} {...colProps} key={p._id}>
            <AggregatorProfileGridCard performer={p} className="performer-box performer-box-4-item" />
          </Col>
        )}
      />
    </Row>
  );

  useEffect(() => {
    backToTop();
    getRelatedCams();
  }, []);

  return (
    <Row className={style['cams-details']} gutter={10}>
      <SeoMetaHead item={performer} />
      <Col md={6} xs={24} lg={8}>
        <div className="profile-card">
          <div className="avatar">
            {performer.avatar && (<img src={performer.avatar} alt={performer.username} style={{ objectFit: 'contain', width: '100%', maxWidth: 300 }} />)}
          </div>

          <div className="profile">
            <div className="name">
              <span className="lable">Username: </span>
              <span className="" style={{ textTransform: 'capitalize' }}>
                <a href={performer.profileLink} target="_blank" rel="noreferrer">
                  {performer.username}
                </a>

              </span>
            </div>
            <div className="gender">
              <span className="lable">Gender: </span>
              <span className="" style={{ textTransform: 'capitalize' }}>
                {performer.gender}
              </span>
            </div>
            {performer.age ? (
              <div className="age">
                <span className="lable">Age: </span>
                <span className="" style={{ textTransform: 'capitalize' }}>
                  {performer.age}
                </span>
              </div>
            ) : null}
            <div className="bio">
              <span>{performer.aboutMe}</span>
            </div>
            <br />
            {performer.tags?.length ? (
              <>
                <p>What We do on webcam</p>
                <div className="tags">
                  {performer.tags.map((tag) => (
                    <Link
                      href={{ pathname: '/cams', query: { tag } }}
                      key={tag}
                      as={`/cams?tag=${tag}`}
                    >
                      <a>
                        #
                        {tag}
                      </a>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <Button
            type="primary"
            className="custom-button"
            hidden={performer.service === 'xlovecam'}
            onClick={() => window.open(performer.profileLink)}
            // href={performer.profileLink}
            // target="_blank"
          >
            <span>{`START LIVE SEX SHOW WITH ${performer.username}`}</span>
          </Button>
        </div>
      </Col>
      <Col md={18} xs={24} lg={16}>
        {performer.iframe
          ? performer.isStreaming && _renderIframe(performer.service, performer.iframe)
          : _renderRelatedCams({ md: 8, lg: 6 })}

      </Col>

      {performer.iframe && relatedCams.length > 0 && (
      <Col md={24} xs={24}>
        <Title>Related Cams</Title>
        {_renderRelatedCams({ lg: 4 })}
      </Col>
      )}

    </Row>
  );
}

CamDetails.authenticate = false;

CamDetails.getInitialProps = async (ctx) => {
  try {
    const { query } = ctx;
    const resp: IResponse<IAggregatorCams> = await camAggregatorService.profile(query.username);
    if (typeof window !== 'undefined') {
      if (!resp.data) return Router.push('/cams');
      if (!resp.data.iframe && resp.data.profileLink) {
        message.info('Please click model profile link to view their stream.');
        // window.location.href = resp.data.profileLink;
      }
    }

    return {
      performer: resp.data
    };
  } catch (e) {
    return redirect404(ctx);
  }
};

export default CamDetails;
