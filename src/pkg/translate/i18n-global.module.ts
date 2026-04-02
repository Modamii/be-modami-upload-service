import { join } from 'path';

import { Global, Module } from '@nestjs/common';

const LANGUAGE = { EN: 'en' };
import { ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import { HEADER_LANGUAGE } from 'src/pkg/common/constants';

@Global()
@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const defaultLang = configService.get('lang');
        return {
          fallbackLanguage: defaultLang || LANGUAGE.EN,
          loaderOptions: {
            path: join(__dirname, '/i18n/'),
            watch: true,
          },
        };
      },
      resolvers: [new HeaderResolver([HEADER_LANGUAGE])],
      inject: [ConfigService],
    }),
  ],
  exports: [I18nModule],
})
export class I18nGlobalModule {}
