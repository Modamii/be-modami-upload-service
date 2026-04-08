'use strict';
const querystring = require('querystring');

// https://stackoverflow.com/questions/175739/how-can-i-check-if-a-string-is-a-valid-number
function isNumeric(str) {
  if (typeof str != 'string') return false;
  return !isNaN(str) && !isNaN(parseFloat(str));
}

function downloadHandle(event, context, callback) {
  const request = event.Records[0].cf.request;
  const params = querystring.parse(request.querystring);
  // AWS S3: Force File Download using 'response-content-disposition'
  // Reference: https://stackoverflow.com/questions/19046718/aws-s3-force-file-download-using-response-content-disposition
  let filename = request.uri.substring(request.uri.lastIndexOf('/') + 1);
  if (filename == '') {
    filename = 'download';
  }
  if (!filename.includes('.')) {
    filename += '.webp';
  }
  // Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
  params['response-content-disposition'] = `attachment;filename=${filename}`;
  request.querystring = querystring.stringify(params);

  // Set cache control
  params['response-cache-control'] = `public, max-age=60, s-maxage=300`;

  // download hq
  request.uri = request.uri.replace('variants', 'hq');
  callback(null, request);
  return;
}

function imageHandle(event, context, callback) {
  const request = event.Records[0].cf.request;
  const params = querystring.parse(request.querystring);
  const width = params['width'];
  const allowWidths = [
    16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920,
  ]; // 2048, 3840,

  if (request.origin.s3 && request.origin.s3.domainName) {
    request.headers['host'] = [
      { key: 'host', value: request.origin.s3.domainName },
    ];

    const download = params['download'];
    if (download) {
      return downloadHandle(event, context, callback);
    }

    // Update cache control
    let sMaxAge = 86400; // 1d
    let maxAge = 600;
    if (request.uri.includes('avatar')) {
      maxAge = 300;
      sMaxAge = 259200; // 3d
    }

    params[
      'response-cache-control'
    ] = `public, max-age=${maxAge}, s-maxage=${sMaxAge}`;
    request.querystring = querystring.stringify(params);
  }

  if (width && isNumeric(width)) {
    if (!width.match(/\.(webp|jpg)$/g)) {
      let closestWidth = null;
      // https://stackoverflow.com/questions/8584902/get-the-closest-number-out-of-an-array
      closestWidth = allowWidths.reduce((prev, curr) => {
        return Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev;
      });

      if (closestWidth) request.uri += `_${closestWidth}.webp`;
    }
  }
  callback(null, request);
}

function animationHandle(event, context, callback) {
  const request = event.Records[0].cf.request;
  const params = querystring.parse(request.querystring);
  const width = params['width'];
  const allowAnimationWidths = [16, 32, 48, 64, 96, 128];

  if (request.origin.s3 && request.origin.s3.domainName) {
    request.headers['host'] = [
      { key: 'host', value: request.origin.s3.domainName },
    ];

    const download = params['download'];
    if (download) {
      return downloadHandle(event, context, callback);
    }

    // Update cache control
    let sMaxAge = 86400; // 1d
    let maxAge = 600;

    params[
      'response-cache-control'
    ] = `public, max-age=${maxAge}, s-maxage=${sMaxAge}`;
    request.querystring = querystring.stringify(params);
  }

  if (width && isNumeric(width)) {
    if (!width.match(/\.(webp|jpg)$/g)) {
      let closestWidth = null;
      if (width > allowAnimationWidths[allowAnimationWidths.length - 1]) {
        closestWidth = null; // return default
      } else {
        closestWidth = allowAnimationWidths.reduce((prev, curr) => {
          return Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev;
        });
      }

      if (closestWidth) request.uri += `_${closestWidth}.webp`;
    }
  }
  callback(null, request);
}

function uriNftHandle(event, context, callback) {
  const request = event.Records[0].cf.request;
  const params = querystring.parse(request.querystring);

  if (request.origin.s3 && request.origin.s3.domainName) {
    request.headers['host'] = [
      { key: 'host', value: request.origin.s3.domainName },
    ];

    // Update cache control
    let sMaxAge = 3600; // 1h
    let maxAge = 600;

    params[
      'response-cache-control'
    ] = `public, max-age=${maxAge}, s-maxage=${sMaxAge}`;
    request.querystring = querystring.stringify(params);
  }

  callback(null, request);
}

exports.handler = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  // const params = querystring.parse(request.querystring);

  if (
    request.uri.startsWith('/image/variants/') ||
    request.uri.startsWith('/image/hq/') ||
    request.uri.startsWith('/image/health/livez')
  ) {
    return imageHandle(event, context, callback);
  } else if (request.uri.startsWith('/image/animation/')) {
    return animationHandle(event, context, callback);
  } else if (request.uri.startsWith('/image/uri/') || request.uri.startsWith('/image/nfts/')) {
    return uriNftHandle(event, context, callback);
  } else {
    // return not found
    const response = {
      status: '404',
      statusDescription: 'Not found',
      headers: {
        'cache-control': [{ key: 'Cache-Control', value: 'max-age=2' }],
      },
    };
    callback(null, response);
    return;
  }
};
