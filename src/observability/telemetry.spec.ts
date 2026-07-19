import { parseOtelHeaders } from './telemetry';

describe('parseOtelHeaders', () => {
  it('parses Grafana OTLP headers', () => {
    expect(
      parseOtelHeaders('Authorization=Basic%20abc%3D, x-scope = service'),
    ).toEqual({
      Authorization: 'Basic abc=',
      'x-scope': 'service',
    });
  });
});
