import Link from 'next/link';
import React from 'react';
import { IPerformer } from 'src/interfaces';

interface P {
  performer: IPerformer
}

export function PerformerUsername({ performer }: P) {
  return (
    <Link
      href={{
        pathname: '/profile/[username]',
        query: { performer: JSON.stringify(performer) }
      }}
      as={`/profile/${performer.username}`}
    >
      <a>{performer.username}</a>
    </Link>
  );
}
