import { defineConfig as openapiTsDefineConfig } from '@hey-api/openapi-ts';

export const defineConfig = ({
  input,
  name,
}: {
  input: string;
  name: string;
}) =>
  openapiTsDefineConfig({
    plugins: [
      {
        name: '@hey-api/client-angular',
      },
      {
        enums: 'javascript',
        name: '@hey-api/typescript',
      },
      {
        name: '@hey-api/sdk',
        asClass: true,
      },
    ],
    input: input,
    output: {
      path: `src/client/${name}`,
      format: 'prettier',
      lint: 'eslint',
    },
    name: name,
    logs: {
      level: 'debug',
    },
  });
