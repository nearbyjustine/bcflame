'use strict';

const ALLOWED_FONT_MIMES = new Set([
  'font/ttf',
  'font/otf',
  'font/woff',
  'font/woff2',
  'font/eot',
  'font/sfnt',
  'application/font-ttf',
  'application/font-otf',
  'application/font-woff',
  'application/font-woff2',
  'application/vnd.ms-fontobject',
  'application/x-font-ttf',
  'application/x-font-otf',
]);

function validateFontFile(params: any) {
  const file = params.data?.font_file;
  // If no file upload on this request, nothing to validate
  if (!file || !file.data) return;

  const mime = file.data.mime?.toLowerCase();
  if (mime && !ALLOWED_FONT_MIMES.has(mime)) {
    throw new Error(
      `Invalid font file type "${mime}". Allowed types: TTF, OTF, WOFF, WOFF2, EOT.`
    );
  }
}

module.exports = {
  beforeCreate(params: any) {
    validateFontFile(params);
  },
  beforeUpdate(params: any) {
    validateFontFile(params);
  },
};
