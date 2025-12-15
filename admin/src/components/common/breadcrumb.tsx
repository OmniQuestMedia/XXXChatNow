import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb } from 'antd';
import Link from 'next/link';

interface IBreadcrum {
  title: string;
  href?: string;
}

interface IProps {
  breadcrumbs: IBreadcrum[];
}

export function BreadcrumbComponent({
  breadcrumbs
}: IProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Breadcrumb>
        <Breadcrumb.Item href="/dashboard">
          <HomeOutlined />
        </Breadcrumb.Item>
        {breadcrumbs?.map((b) => (
          <Breadcrumb.Item key={b.title}>
            {b.href ? (
              <Link href={b.href}>
                <a>{b.title}</a>
              </Link>
            ) : (
              b.title
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    </div>
  );
}

export default BreadcrumbComponent;
