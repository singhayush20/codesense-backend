import configuration from './configuration';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses secure cookies in prod', () => {
    process.env.ENVIRONMENT = 'prod';

    expect(configuration().cookies).toMatchObject({
      secure: true,
    });
  });
});
