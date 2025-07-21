import { HttpResponse, http } from 'msw';

export const allowCanI = (resource: string, action: string, subresource: string = '*') =>
  http.get(`/api/v1/account/can-i/${resource}/${action}/${subresource}`, () => {
    return HttpResponse.json({ value: 'yes' });
  });

export const denyCanI = (resource: string, action: string, subresource: string = '*') =>
  http.get(`/api/v1/account/can-i/${resource}/${action}/${subresource}`, () => {
    return HttpResponse.json({ value: 'no' });
  });
