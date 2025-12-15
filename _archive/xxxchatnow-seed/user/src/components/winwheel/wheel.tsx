import { IPerformer } from '@interfaces/performer';
import { getResponseError } from '@lib/utils';
import { message } from 'antd';
import classNames from 'classnames';
import {
  useContext, useEffect,
  useRef,
  useState
} from 'react';
import { SocketContext } from 'src/socket';

import styles from './wheel.module.less';
import { useWheel } from './wheel-context';

interface IProps {
  segments: any[];
  conversationId: string;
  performer: IPerformer;
  onFinish: () => void;
}

function Wheel({
  segments, conversationId, performer, onFinish
}: IProps) {
  const [trianglePaths, setTrianglePaths] = useState([]);
  const [activeRotation, setActiveRotation] = useState(true);
  const { getSocket } = useContext(SocketContext);

  const {
    handleSpin, setHandleSpin, setVisibleWheel, setFirstClick
  } = useWheel();

  const refwheel = useRef(null);

  const render = () => {
    const triangles = document.querySelectorAll('.sector');
    const arrow = document.querySelector('.arrow') as HTMLDivElement;
    const pathArrow = document.querySelector('.path-arrow');
    const lights = document.querySelectorAll('.lights g');

    const angle = 360 / triangles.length;

    const tmp = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < triangles.length && lights.length; i++) {
      const triangle = triangles[i];
      const rotation = angle * i;
      const rotationText = rotation + (angle / 2) + 3;

      const trianglePath = triangle.querySelector('path');
      const triangleText = triangle.querySelector('text');

      const light = lights[i];
      const pathLight = light.querySelector('path');
      pathLight.setAttribute('data-index', `${i + 1}`);

      tmp.push({
        index: i + 1,
        path: trianglePath,
        rotation,
        text: triangleText.textContent
      });
      trianglePath.style.transform = `rotate(${rotation}deg)`;
      pathLight.style.transform = `rotate(${rotation + 1}deg) scale(0.98) translate(-4px, -5px)`;
      triangleText.style.transform = `rotate(${rotationText}deg)`;

      if (triangles.length === 5) {
        trianglePath.setAttribute('d', 'M213.18 74.0901C121.96 103.71 56 189.4 56 290.5H283.5L213.18 74.0901Z');
        pathArrow.setAttribute('d', 'M213.18 74.0901C121.96 103.71 56 189.4 56 290.5H283.5L213.18 74.0901Z');
        pathLight.setAttribute('d', 'M203.4,65.5c0-2-1.6-3.6-3.5-3.6c-0.5,0-1,0.1-1.4,0.3l0,0c-32.3,12-62,30.8-87.2,55.9  c-45.9,45.7-71.4,106.4-71.8,171.2l0,0c0,0.1,0,0.1,0,0.2c0,2,1.6,3.6,3.5,3.6c1.9,0,3.5-1.6,3.5-3.5c0-0.1,0-0.2,0-0.4l0,0  C47.2,188.3,111.2,102.4,200.6,69l0,0C202.2,68.6,203.4,67.2,203.4,65.5z');
      }
      if (triangles.length === 6) {
        trianglePath.setAttribute('d', 'M169.73 93.45C101.75 132.79 56 206.3 56 290.5H283.5L169.73 93.45Z');
        pathArrow.setAttribute('d', 'M169.73 93.45C101.75 132.79 56 206.3 56 290.5H283.5L169.73 93.45Z');
        pathLight.setAttribute('d', 'M161.2,87c0-2-1.5-3.6-3.4-3.7c-0.8,0-1.4,0.2-2,0.7l0,0c-15.7,9.6-30.4,21-43.9,34.3  c-46.3,45.4-72.3,106.2-73.1,171.1c0,0,0,0.1,0,0.1c0,0,0,0,0,0.1c0,0.2,0,0.3,0,0.5c0,0,0,0,0,0l0.1,0c0.3,1.7,1.7,3,3.4,3  c1.7,0,3.2-1.3,3.5-2.9l0,0c0,0,0,0,0,0c0-0.2,0-0.3,0-0.5c0,0,0,0,0-0.1c0,0,0,0,0-0.1c1-84.2,46.2-157.8,113.2-199l0,0  C160.2,89.8,161.1,88.5,161.2,87z');
      }
      if (triangles.length === 7) {
        trianglePath.setAttribute('d', 'M141.66 112.64C89.46 154.32 56 218.5 56 290.5H283.5L141.66 112.64Z');
        pathArrow.setAttribute('d', 'M141.66 112.64C89.46 154.32 56 218.5 56 290.5H283.5L141.66 112.64Z');
        pathLight.setAttribute('d', 'M128.3,110.5c0-2-1.6-3.5-3.6-3.6c-1,0-1.9,0.4-2.6,1.1l0,0c-4.1,3.6-8.2,7.4-12.1,11.3  c-45.3,45.5-70.5,106.2-70.9,170.9c0,0.1,0,0.1,0,0.2l0,0c0.2,1.8,1.6,3.2,3.4,3.2c1.8,0,3.2-1.4,3.4-3.2l0,0c0-0.1,0-0.1,0-0.2  c0,0,0,0,0,0c0,0,0-0.1,0-0.1c0,0,0-0.1,0-0.1c0.5-70.5,31.6-133.6,80.4-176.4l0,0C127.5,113,128.3,111.9,128.3,110.5z');
      }
      if (triangles.length === 8) {
        trianglePath.setAttribute('d', 'M122.63 129.63C81.46 170.8 56 227.68 56 290.5H283.5L122.63 129.63Z');
        pathArrow.setAttribute('d', 'M122.63 129.63C81.46 170.8 56 227.68 56 290.5H283.5L122.63 129.63Z');
        pathLight.setAttribute('d', 'M107.6,133.7L107.6,133.7c0.6-0.6,0.9-1.5,1-2.4c0-2-1.5-3.6-3.5-3.7c-1.2,0-2.3,0.6-3,1.6  c-40.2,44.1-62.6,100.6-63.4,160.7l0,0c0,0.1,0,0.1,0,0.2c0,2,1.5,3.6,3.5,3.6c1.9,0,3.5-1.5,3.6-3.5c0-0.1,0-0.3,0-0.4l0,0  C46.5,229.6,69.9,174.9,107.6,133.7z');
      }
      if (triangles.length === 9) {
        trianglePath.setAttribute('d', 'M109.23 144.27C76.02 183.82 56 234.82 56 290.5H283.5L109.23 144.27Z');
        pathArrow.setAttribute('d', 'M109.23 144.27C76.02 183.82 56 234.82 56 290.5H283.5L109.23 144.27Z');
        pathLight.setAttribute('d', 'M94.8,148.8L94.8,148.8c0.4-0.6,0.7-1.3,0.7-2.2c0-2-1.6-3.6-3.5-3.7c-1.3,0-2.5,0.7-3.1,1.9l0,0  c-31.7,41.3-49.2,91.4-49.9,144.4l0,0c0,0,0,0.1,0,0.1c0,2,1.5,3.6,3.5,3.6c1.9,0,3.5-1.6,3.5-3.5c0,0,0-0.1,0-0.1l0,0  C46.7,236.4,64.8,187.8,94.8,148.8z');
      }
      if (triangles.length === 10) {
        trianglePath.setAttribute('d', 'M99.45 156.78C72.13 194.31 56 240.52 56 290.5H283.5L99.45 156.78Z');
        pathArrow.setAttribute('d', 'M99.45 156.78C72.13 194.31 56 240.52 56 290.5H283.5L99.45 156.78Z');
        pathLight.setAttribute('d', 'M85,163c0.3-0.5,0.5-1.1,0.5-1.7c0-2-1.5-3.6-3.5-3.6c-1.2,0-2.3,0.6-2.9,1.5l0,0  C53.7,197.3,39.7,242,38.8,288.8c0,0,0,0,0,0.1c0,0,0,0,0,0c0,0.1,0,0.2,0,0.3l0,0c0.2,1.8,1.6,3.2,3.4,3.2c1.8,0,3.3-1.3,3.5-3l0,0  c0-0.1,0-0.3,0-0.4c0,0,0,0,0-0.1c0,0,0,0,0,0C46.7,242.4,61,199.2,85,163L85,163z');
      }
    }
    setTrianglePaths(tmp);

    if (tmp.length > 2) {
      arrow.style.transform = `rotate(${(tmp[1].rotation) / 2}deg) translate(-21px, -2px)`;
    }
  };
  const handleClick = () => {
    const rotationDiv = document.querySelector('.sectors') as HTMLDivElement;
    const LightDiv = document.querySelector('.lights') as HTMLDivElement;
    rotationDiv.style.transform = 'rotate(0deg)';
    rotationDiv.style.transition = 'none';

    if (!performer.isOnline) {
      message.error('Performer is Offline!');
      return;
    }
    if (!window.confirm(`${performer?.spinWheelPrice} tk / spin`)) return;

    setActiveRotation(false);
    const socket = getSocket();
    socket.emit('spin-wheel/create', {
      conversationId,
      performerId: performer?._id
    }, ({ error, segment }) => {
      if (error) {
        message.error(getResponseError(error));
        return;
      }

      const elementNumer = trianglePaths.find((element) => element.text === segment);
      const rotationNumber = 2520 - (elementNumer.rotation);
      const rotationIndex = elementNumer.index;
      const lightPath = document.querySelectorAll('.lights path');
      lightPath.forEach((path) => {
        path.classList.remove('active');
        path.classList.remove('unactive');
      });
      setTimeout(() => {
        rotationDiv.style.transition = 'transform 8s cubic-bezier(0.4, 0.3, 0, 1)';
        rotationDiv.style.transform = `rotate(${rotationNumber}deg)`;
        LightDiv.style.transform = `rotate(${rotationNumber}deg)`;
      }, 500);
      setTimeout(() => {
        lightPath.forEach((path) => {
          path.classList.add('unactive');
          const pathIndex = path.getAttribute('data-index');
          const parsedPathIndex = parseInt(pathIndex, 10);
          if (rotationIndex === parsedPathIndex) {
            path.classList.add('active');
          }
        });
      }, 9000);
      setTimeout(() => {
        message.success(`You have won ${elementNumer.text}`);
        onFinish();
      }, 9500);
    });
  };

  setTimeout(() => {
    refwheel.current.classList.add('vlass');
  }, 200);

  useEffect(() => {
    if (segments.length > 0) {
      render();
    }
  }, [segments]);

  useEffect(() => {
    if (handleSpin) {
      handleClick();
      setHandleSpin(false);
    }
  }, [handleSpin]);

  return (
    <div className={classNames(styles.wheelWrapper, { 'active-wheel': activeRotation })}>
      <div className="show-wheel" ref={refwheel}>
        <svg width="567" height="581" viewBox="0 0 567 581" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_107_164)">
            <circle className="circle-wheel" cx="283.5" cy="290.5" r="253.5" fill="#2A2A2A" />
          </g>
          <circle cx="283.5" cy="290.5" r="227.5" fill="#CF85F9" />
          <path d="M145.5 98L149 83L151.5 81.5L168.5 67L211 55L226.5 67L186.5 84.5L145.5 98Z" fill="#2A2A2A" />

          <g className="close-rotation" onClick={() => { setVisibleWheel(false); setFirstClick(true); }}>
            <path d="M190 49.061C196 59.461 207.5 55.5 211.5 54.5L211.5 55.561C198.667 61.061 167.6 74.561 146 84.561C156.5 78.061 154 70.061 152.5 65.561C149.5 59 147.5 54.561 147.5 49.061C147.5 38.1963 157.5 30.561 164.5 30.061C183 29.061 186 40.561 190 49.061Z" fill="#2A2A2A" />
            <path d="M168 50L158.5 46.5L157 49.5L166.5 53L163 62L166.5 63.5L170 54L180 57.5L181 54.5L171.5 51L174.5 41L171.5 40L168 50Z" fill="#BBBBBB" />
          </g>
          <g className="lights">
            {segments.map(() => (
              <g>
                <path />
              </g>
            ))}
          </g>
          <g className="group-sectors" onClick={() => handleClick()}>
            <g className="sectors">
              {segments.map((item) => (
                <g className="sector" key={item.index}>
                  <path fill={item.color} />
                  <text x="80" y="305" className="sector-text" fill="white">{item.description}</text>
                </g>
              ))}
            </g>
            <path className="path-arrow" stroke="#fff" strokeWidth="7" />
            <path className="arrow" filter="url(#filter3_d_107_164)" d="M32.476 264.678C32.476 261.599 35.8093 259.675 38.476 261.214L82.726 286.762C85.3926 288.301 85.3926 292.15 82.726 293.69L38.476 319.238C35.8093 320.777 32.476 318.853 32.476 315.774L32.476 264.678Z" fill="#680499" stroke="#fff" strokeWidth="7" />

            <circle className="circle-center" filter="url(#filter2_i_107_164)" cx="283.5" cy="290.5" r="62.5" fill="white" />
            <circle cx="283.5" cy="290.5" r="57.5" stroke="#2A2A2A" strokeWidth="10" />
          </g>

          <filter id="filter3_d_107_164" x="12.476" y="240.672" width="92.25" height="99.1074" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="10" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_107_164" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_107_164" result="shape" />
          </filter>
          <filter id="filter0_d_107_164" x="0" y="7" width="567" height="567" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="15" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_107_164" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_107_164" result="shape" />
          </filter>
          <filter id="filter2_i_107_164" x="220" y="235" width="125" height="125" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feOffset />
            <feGaussianBlur stdDeviation="25" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.8 0" />
            <feBlend mode="normal" in2="shape" result="effect1_innerShadow_107_164" />
          </filter>
        </svg>
      </div>
    </div>
  );
}

export default Wheel;
