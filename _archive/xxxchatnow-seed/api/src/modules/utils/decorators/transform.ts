import { isNaN } from 'lodash';

export const transformToBoolean = ({
  obj,
  key
}) => {
  const val = obj ? obj[key] : undefined;
  if ([null, undefined, ''].includes(val)) return undefined;
  if (typeof val === 'string') {
    return !['false', '0'].includes(val);
  }
  if (typeof val === 'boolean') {
    return val;
  }
  return !!val;
};

export const transformToNumber = ({
  obj,
  key
}) => {
  const val = obj ? obj[key] : undefined;

  if ([null, undefined, ''].includes(val)) return undefined;
  if (typeof val === 'number') return val;
  return parseFloat(val);
};

export const transformToArrayFromString = ({
  value
}) => {
  if ([null, undefined, ''].includes(value)) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').filter((v) => !!v);
  return value;
};

export const transformToDate = ({
  obj,
  key
}) => {
  const val = obj ? obj[key] : undefined;

  if ([null, undefined, ''].includes(val)) return undefined;
  const dateCheck = new Date(val);
  const isDate = (dateCheck as any !== 'Invalid Date') && !isNaN(dateCheck);

  return isDate ? dateCheck : undefined;
};
