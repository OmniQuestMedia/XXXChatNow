import Loader from '@components/common/base/loader';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const AuthLayout = dynamic(() => (import('./auth-layout')));
const DefaultLayout = dynamic(() => (import('./default-layout')));
const MaintenanceLayout = dynamic(() => (import('./maintenance-layout')));
const PrimaryLayout = dynamic(() => (import('./primary-layout')));
const PublicLayout = dynamic(() => (import('./public-layout')));
const StreamLayout = dynamic(() => (import('./stream-layout')));

interface DefaultProps {
  children: any;
  layout?: string;
  maintenanceMode?: boolean;
}

const LayoutMap = {
  maintenance: MaintenanceLayout,
  primary: PrimaryLayout,
  public: PublicLayout,
  auth: AuthLayout,
  default: DefaultLayout,
  stream: StreamLayout
};

export function BaseLayout({
  children,
  layout = '',
  maintenanceMode = false
}: DefaultProps) {
  const [routerChange, setRouterChange] = useState(false);
  const router = useRouter();

  const onRouteChangeStart = () => {
    setRouterChange(true);
  };

  const onRouteChangeComplete = () => {
    setRouterChange(false);
  };

  useEffect(() => {
    router.events.on('routeChangeStart', onRouteChangeStart);
    router.events.on('routeChangeComplete', onRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', onRouteChangeStart);
      router.events.off('routeChangeComplete', onRouteChangeComplete);
    };
  }, []);

  if (maintenanceMode) return <MaintenanceLayout />;

  const Container = layout && LayoutMap[layout] ? LayoutMap[layout] : LayoutMap.public;
  return (
    <Container>
      {routerChange && <Loader spinning fullScreen />}
      {children}
    </Container>
  );
}

export default BaseLayout;
