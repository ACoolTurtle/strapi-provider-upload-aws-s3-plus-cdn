'use strict';

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const AWS = require('aws-sdk');

module.exports = {
  init(config) {
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...config,
    });

    return {
      upload(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket
          const path = file.path ? `${file.path}/` : '';
          let params = {
            Key: `${path}${file.hash}${file.ext}`,
            Body: Buffer.from(file.buffer, 'binary'),
            ContentType: file.mime,
            ...customParams,
          };

          // Needed for Cloudflare to work
          params.ACL = 'public-read';
          

          S3.upload(params, (err, data) => {
            if (err) {
              return reject(err);
            }

            // set the bucket file url
            if (S3.config.cdnUrl) {
              // Write the url using the CDN instead of S3
              file.url = new URL(data.Key, S3.config.cdnUrl).href;
            } else {
              // Use the S3 location if no cdn configured
              file.url = data.Location;
            }

            resolve();
          });
        });
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = file.path ? `${file.path}/` : '';
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};
