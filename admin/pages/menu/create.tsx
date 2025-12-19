import { BreadcrumbComponent } from '@components/common';
import Page from '@components/common/layout/page';
import { FormMenu } from '@components/menu/form-menu';
import { menuService } from '@services/menu.service';
import { message } from 'antd';
import Head from 'next/head';
import Router from 'next/router';
import { PureComponent } from 'react';

class MenuCreate extends PureComponent {
  state = {
    submitting: false
  };

  async submit(data: any) {
    try {
      this.setState({ submitting: true });

      const submitData = {
        ...data,
        value: data.value / 100
      };
      await menuService.create(submitData);
      message.success('Created successfully');
      this.setState(
        {
          submitting: false
        },
        () => window.setTimeout(() => {
          Router.push(
            {
              pathname: '/menu'
            },
            '/menu'
          );
        }, 1000)
      );
    } catch (e) {
      // TODO - check and show error here
      const err = (await Promise.resolve(e)) || {};
      message.error(err.message || 'Something went wrong, please try again!');
      this.setState({ submitting: false });
    }
  }

  render() {
    return (
      <>
        <Head>
          <title>Create new menu</title>
        </Head>
        <BreadcrumbComponent breadcrumbs={[{ title: 'Menus', href: '/menu' }, { title: 'Create new menu' }]} />
        <Page>
          <FormMenu onFinish={this.submit.bind(this)} submitting={this.state.submitting} />
        </Page>
      </>
    );
  }
}

export default MenuCreate;
