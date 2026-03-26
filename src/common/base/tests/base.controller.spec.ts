import { BaseController } from '../base.controller';
import { Expose } from 'class-transformer';

class Demo {
  excludeField: string;

  @Expose()
  name?: string;

  @Expose({ name: 'mime_type' })
  mimeType?: string;

  @Expose({ name: 'group_field', groups: ['get'] })
  groupField?: string;
}

describe('FilesController', () => {
  let controller: BaseController;

  beforeEach(async () => {
    controller = new BaseController();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('expose', () => {
    it('should only expose fields has decorator @Expose() and rename fields', () => {
      const data: Demo = {
        mimeType: '...',
        name: '123',
        excludeField: 'hello',
      };
      const arrData = [data, data];
      const expectData = { name: data.name, mime_type: data.mimeType };

      expect(controller.expose(Demo, data)).toEqual(expectData);

      expect(controller.expose(Demo, arrData)).toEqual([
        expectData,
        expectData,
      ]);
    });

    it('should expose group fields', () => {
      const data: Demo = {
        mimeType: '...',
        name: '123',
        excludeField: 'hello',
        groupField: 'alo',
      };
      const expectData = {
        name: data.name,
        mime_type: data.mimeType,
        group_field: data.groupField,
      };

      expect(controller.expose(Demo, data, { groups: ['get'] })).toEqual(
        expectData,
      );
    });

    it('should not expose group fields', () => {
      const data: Demo = {
        mimeType: '...',
        name: '123',
        excludeField: 'hello',
        groupField: 'alo',
      };
      const expectData = { name: data.name, mime_type: data.mimeType };

      expect(controller.expose(Demo, data)).toEqual(expectData);
    });
  });
});
