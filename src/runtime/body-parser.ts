import accepts from 'attr-accept';
import bodyParser from 'body-parser';
import Busboy from 'busboy';
import bytes from 'bytes';
import fs from 'fs';
import os from 'os';
import path from 'path';
import picoid from 'picoid';

import { setField } from './set-field';

type ContentType =
  | 'application/json'
  | 'application/x-www-form-urlencoded'
  | 'multipart/form-data';

export type File = {
  name: string;
  size: number;
  type: string;
  path?: string;
} & Record<string, any>;

export type BodyParserOptions = {
  limits?: {
    /**
     * The maximum number of files a user can upload. Note that empty file
     * fields, still count against the file count limit.
     */
    fileCount?: number;

    /**
     * The maximum size per file in bytes.
     */
    fileSize?: number | string;

    /**
     * The maximum size of text fields.
     */
    fieldSize?: number | string;

    /**
     * The maximum size of json payloads.
     */
    jsonSize?: number | string;

    /**
     * A valid HTML accept string to restrict mime-types.
     * See https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept
     */
    mimeType?: string;
  };

  /**
   * The directory where files will be stored. Defaults to the os.tmpdir
   */
  uploadDir?: string;

  /**
   * Handle the file streams, and pipe them to S3, file system, or whatever.
   * When using this, files will no longer be written to the file system.
   */
  onFile?: (params: {
    field: string;
    file: File;
    stream: NodeJS.ReadableStream;
  }) => void;
};

const ACCEPT: ContentType[] = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
];

export async function bodyparser<TData extends Record<string, unknown>>(
  req,
  options?: BodyParserOptions,
): Promise<TData> {
  const uploadDir = options.uploadDir || os.tmpdir();
  const limits = options.limits || {};

  // convert string based sizes to numbers
  const maxFileCount = limits.fileCount || undefined;
  const maxFileSize: number = bytes.parse(limits.fileSize) || undefined;
  const maxFieldSize: number = bytes.parse(limits.fieldSize) || undefined;
  const maxJsonSize: number = bytes.parse(limits.jsonSize) || undefined;

  if (!req.headers['content-type']) return;
  if (!ACCEPT.some((type) => req.headers['content-type'].startsWith(type))) {
    return;
  }

  // application/json is handled by bodyParser, as busboy doesn't support it
  if (req.headers['content-type'].startsWith('application/json')) {
    const errors = [];
    let lastKey;

    const jsonParser = bodyParser.json({
      limit: maxJsonSize,
      reviver: maxFieldSize
        ? (key, value) => {
            if (typeof value === 'string' && value.length > maxFieldSize) {
              const field = /[0-9]+/.test(key) ? `${lastKey}.${key}` : key;
              errors.push({
                name: 'FIELD_SIZE_EXCEEDED',
                message: `field "${field}" exceeds ${bytes(maxFieldSize)}`,
              });
            }

            lastKey = /[0-9]+/.test(key) ? lastKey : key;
            return value;
          }
        : undefined,
    });

    return new Promise((resolve, reject) =>
      jsonParser(req, null, (error) => {
        if (error?.type === 'entity.too.large') {
          errors.push({
            name: 'JSON_SIZE_EXCEEDED',
            message: `json object exceeds ${bytes(maxJsonSize)}`,
          });
        }

        if (errors.length) {
          return reject({ errors });
        }

        resolve(req.body);
      }),
    );
  }

  // busboy handles application/x-www-form-urlencoded and multipart/form-data,
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: req.headers,
      limits: {
        files: maxFileCount,
        fileSize: maxFileSize,
        fieldSize: maxFieldSize,
      },
    });

    const data = {};
    const errors = [];

    // We don't want to have these heavy ops when the developer didn't think of it.
    if (maxFileCount || options.uploadDir || options.onFile) {
      busboy.on('file', async (field, file, name, encoding, type) => {
        const value: File = { name, type, size: 0 };

        // skip empty fields
        if (!value.name) return file.resume();

        if (limits.mimeType && !accepts({ name, type }, limits.mimeType)) {
          errors.push({
            name: 'FILE_TYPE_REJECTED',
            message: `file "${value.name}" is not of type "${limits.mimeType}"`,
          });
          return file.resume();
        }

        if (options.onFile) {
          options.onFile({ field, file: value, stream: file });
        } else {
          // write to disk when the user doesn't provide an onFile handler
          await fs.promises.mkdir(uploadDir, { recursive: true });
          value.path = path.join(
            uploadDir,
            path.basename(field) + '_' + picoid(17),
          );
          file.pipe(fs.createWriteStream(value.path));
        }

        file.on('data', (data) => {
          value.size = data.length;
        });

        file.on('end', async () => {
          if ((file as any).truncated) {
            return errors.push({
              name: 'FILE_SIZE_EXCEEDED',
              message: `file "${value.name}" exceeds ${bytes(maxFileSize)}`,
            });
          }

          return setField(data, field, value);
        });
      });
    }

    busboy.on('field', function (field, value, _, truncated) {
      if (truncated) {
        return errors.push({
          name: 'FIELD_SIZE_EXCEEDED',
          message: `field "${field}" exceeds ${bytes(maxFieldSize)}`,
        });
      }

      setField(data, field, value);
    });

    busboy.on('filesLimit', () => {
      errors.push({
        name: 'FILE_COUNT_EXCEEDED',
        message: `file count exceeds ${maxFileCount}`,
      });
    });

    busboy.on('finish', () => {
      if (errors.length > 0) {
        return reject({ errors });
      }

      req.body = data;

      // push it to a next frame, so that onFile promises complete first
      setTimeout(() => {
        resolve(data as TData);
      }, 0);
    });

    req.pipe(busboy);
  });
}
