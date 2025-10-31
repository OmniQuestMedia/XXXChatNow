import { Col, Form, Row } from 'antd';
import Link from 'next/link';
import React from 'react';

const { Item: FormItem } = Form;

interface IFormFooterLogin {
  account: 'user' | 'performer' | 'studio',
  singularTextModel?: string;
}

function FormFooterLogin({
  account,
  singularTextModel = 'Performer'
}: IFormFooterLogin) {
  return (
    <Row>
      <Col span={24}>
        {account !== 'studio' && account === 'user' ? (
          <FormItem>
            Want to be a Member?
            {' '}
            <Link href="/auth/register/user" as="/signup/member">
              <a>Signup here</a>
            </Link>
          </FormItem>
        )
          : account === 'performer' && (
            <FormItem>
              Want to be a
              {' '}
              {singularTextModel || 'Performer'}
              ?
              {' '}
              <Link href="/auth/register/model" as="/signup/model">
                <a>Signup here</a>
              </Link>
            </FormItem>
          )}
        {account === 'studio' && (
          <FormItem>
            {'Don\'t have account yet? '}
            <Link href="/studio/register">
              <a>Signup now</a>
            </Link>
          </FormItem>
        )}
      </Col>
      <Col span={24}>
        {account === 'user' && (
          <FormItem>
            Are you a
            {' '}
            {singularTextModel || 'Performer'}
            ?
            {' '}
            <Link href="/auth/login/performer">
              <a>Login here</a>
            </Link>
          </FormItem>
        )}
        {account === 'performer' && (
          <FormItem>
            Are you a Member?
            {' '}
            <Link href="/auth/login/user">
              <a>Login here</a>
            </Link>
          </FormItem>
        )}
      </Col>
    </Row>
  );
}

export default FormFooterLogin;
