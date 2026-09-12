export interface NdviPeriodInput {
  from: string;
  to: string;
}

export interface NdviRequestInput {
  latitude?: number;
  longitude?: number;
  bbox?: [number, number, number, number];
  radiusKm?: number;
  baseline?: NdviPeriodInput;
  current?: NdviPeriodInput;
  declaredTonnage?: number;
}

export interface NdviPeriodResult {
  from: string;
  to: string;
  meanNdvi: number;
  cloudCoveragePct: number;
  captureDate: string;
}

export interface NdviComparisonResult {
  source: 'copernicus' | 'mock';
  configured: boolean;
  bbox: [number, number, number, number];
  baseline: NdviPeriodResult;
  current: NdviPeriodResult;
  meanNdvi: number;
  ndviDelta: number;
  cloudCoveragePct: number;
  captureDate: string;
  calculatedSatelliteTonnage: number;
  warning?: string;
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

interface SentinelStatsInterval {
  interval?: {
    from?: string;
    to?: string;
  };
  outputs?: {
    ndvi?: {
      bands?: {
        B0?: {
          stats?: {
            mean?: number;
            sampleCount?: number;
            noDataCount?: number;
          };
        };
      };
    };
  };
}

interface SentinelStatsResponse {
  data?: SentinelStatsInterval[];
}

interface CopernicusTokenResponse {
  access_token?: string;
  expires_in?: number;
}

const AUTH_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const STATISTICS_URLS = [
  'https://sh.dataspace.copernicus.eu/api/v1/statistics',
  'https://sh.dataspace.copernicus.eu/statistics/v1'
];
const DEFAULT_LATITUDE = -9.0;
const DEFAULT_LONGITUDE = -70.8;
const DEFAULT_RADIUS_KM = 5;
const DEFAULT_DECLARED_TONNAGE = 500;
const COPERNICUS_TIMEOUT_MS = 30_000;

const NDVI_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}

function isCloud(sample) {
  return sample.SCL === 3 || sample.SCL === 8 || sample.SCL === 9 || sample.SCL === 10 || sample.SCL === 11;
}

function evaluatePixel(sample) {
  const denominator = sample.B08 + sample.B04;
  const valid = sample.dataMask === 1 && denominator !== 0 && !isCloud(sample);
  return {
    ndvi: [valid ? (sample.B08 - sample.B04) / denominator : 0],
    dataMask: [valid ? 1 : 0]
  };
}`;

export class SatelliteService {
  private static tokenCache: TokenCache | null = null;

  static isConfigured(): boolean {
    return Boolean(process.env.COPERNICUS_CLIENT_ID && process.env.COPERNICUS_CLIENT_SECRET);
  }

  static async getNdviComparison(input: NdviRequestInput = {}): Promise<NdviComparisonResult> {
    const bbox = this.resolveBbox(input);
    const ranges = this.resolveRanges(input);
    const declaredTonnage = Number(input.declaredTonnage || DEFAULT_DECLARED_TONNAGE);

    if (!this.isConfigured()) {
      return this.buildMockResult(bbox, ranges.baseline, ranges.current, declaredTonnage, 'Copernicus credentials are not configured. Using deterministic demo NDVI values.');
    }

    try {
      const [baseline, current] = await Promise.all([
        this.fetchPeriodStats(bbox, ranges.baseline),
        this.fetchPeriodStats(bbox, ranges.current)
      ]);

      const ndviDelta = Number((current.meanNdvi - baseline.meanNdvi).toFixed(3));

      return {
        source: 'copernicus',
        configured: true,
        bbox,
        baseline,
        current,
        meanNdvi: current.meanNdvi,
        ndviDelta,
        cloudCoveragePct: current.cloudCoveragePct,
        captureDate: current.captureDate,
        calculatedSatelliteTonnage: this.calculateSatelliteTonnage(ndviDelta, declaredTonnage)
      };
    } catch (error) {
      const message = this.describeError(error);
      console.warn('[Satellite] Copernicus request failed, using mock fallback:', message);
      return this.buildMockResult(bbox, ranges.baseline, ranges.current, declaredTonnage, `Copernicus request failed: ${message}. Using deterministic demo NDVI values.`);
    }
  }

  private static async fetchPeriodStats(bbox: [number, number, number, number], period: NdviPeriodInput): Promise<NdviPeriodResult> {
    const token = await this.getAccessToken();
    const dimensions = this.resolveRasterDimensions(bbox);
    const requestBody = JSON.stringify(this.buildStatsRequestBody(bbox, period, dimensions));
    let lastError: unknown = null;

    for (const url of STATISTICS_URLS) {
      try {
        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: requestBody
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Statistical API HTTP ${response.status} at ${url}: ${errorText.slice(0, 240)}`);
        }

        const payload = await response.json() as SentinelStatsResponse;
        const intervals = Array.isArray(payload?.data) ? payload.data as SentinelStatsInterval[] : [];
        const candidates = intervals
          .map((interval) => this.parseInterval(interval))
          .filter((interval): interval is NdviPeriodResult => Boolean(interval))
          .sort((a, b) => b.captureDate.localeCompare(a.captureDate));

        if (candidates.length === 0) {
          throw new Error(`No cloud-free Sentinel-2 NDVI pixels found between ${period.from} and ${period.to}`);
        }

        return candidates[0];
      } catch (error) {
        lastError = error;
        console.warn(`[Satellite] Statistical API attempt failed for ${url}:`, this.describeError(error));
      }
    }

    throw new Error(`All Statistical API endpoints failed: ${this.describeError(lastError)}`);
  }

  private static buildStatsRequestBody(
    bbox: [number, number, number, number],
    period: NdviPeriodInput,
    dimensions: { width: number; height: number }
  ) {
    return {
      input: {
        bounds: {
          bbox,
          properties: {
            crs: 'http://www.opengis.net/def/crs/EPSG/0/4326'
          }
        },
        data: [
          {
            type: 'sentinel-2-l2a',
            dataFilter: {
              timeRange: {
                from: period.from,
                to: period.to
              },
              mosaickingOrder: 'leastCC',
              maxCloudCoverage: 60
            }
          }
        ]
      },
      aggregation: {
        timeRange: {
          from: period.from,
          to: period.to
        },
        aggregationInterval: {
          of: 'P1D'
        },
        evalscript: NDVI_EVALSCRIPT,
        width: dimensions.width,
        height: dimensions.height
      },
      calculations: {
        ndvi: {
          statistics: {
            default: {
              percentiles: {
                k: [10, 50, 90]
              }
            }
          }
        }
      }
    };
  }

  private static parseInterval(interval: SentinelStatsInterval): NdviPeriodResult | null {
    const stats = interval.outputs?.ndvi?.bands?.B0?.stats;
    const mean = stats?.mean;
    const sampleCount = Number(stats?.sampleCount || 0);
    const noDataCount = Number(stats?.noDataCount || 0);

    if (typeof mean !== 'number' || !Number.isFinite(mean) || sampleCount <= noDataCount) {
      return null;
    }

    const from = interval.interval?.from || new Date().toISOString();
    const to = interval.interval?.to || from;
    const cloudyRatio = sampleCount > 0 ? noDataCount / sampleCount : 0;

    return {
      from,
      to,
      meanNdvi: Number(mean.toFixed(3)),
      cloudCoveragePct: Number(Math.min(100, Math.max(0, cloudyRatio * 100)).toFixed(1)),
      captureDate: from.slice(0, 10)
    };
  }

  private static async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 30_000) {
      return this.tokenCache.accessToken;
    }

    const clientId = process.env.COPERNICUS_CLIENT_ID;
    const clientSecret = process.env.COPERNICUS_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('Copernicus credentials are missing');
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret
    });

    const response = await this.fetchWithTimeout(AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OAuth token HTTP ${response.status}: ${errorText.slice(0, 240)}`);
    }

    const payload = await response.json() as CopernicusTokenResponse;
    if (!payload?.access_token) {
      throw new Error('OAuth token response did not include an access token');
    }

    const expiresInMs = Number(payload.expires_in || 300) * 1000;
    this.tokenCache = {
      accessToken: payload.access_token,
      expiresAt: now + expiresInMs
    };

    return this.tokenCache.accessToken;
  }

  private static async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), COPERNICUS_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal
      });
    } catch (error) {
      throw new Error(`${url} fetch failed: ${this.describeError(error)}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static describeError(error: unknown): string {
    if (!error) {
      return 'Unknown error';
    }

    if (error instanceof Error) {
      const cause = (error as Error & { cause?: unknown }).cause;
      const causeMessage = cause instanceof Error
        ? cause.message
        : cause && typeof cause === 'object' && 'message' in cause
          ? String((cause as { message?: unknown }).message)
          : '';
      const causeCode = cause && typeof cause === 'object' && 'code' in cause
        ? String((cause as { code?: unknown }).code)
        : '';
      const parts = [error.message, causeCode, causeMessage].filter(Boolean);
      return Array.from(new Set(parts)).join(' | ');
    }

    return String(error);
  }

  private static resolveBbox(input: NdviRequestInput): [number, number, number, number] {
    if (input.bbox && input.bbox.length === 4) {
      return input.bbox.map(Number) as [number, number, number, number];
    }

    const latitude = Number(input.latitude ?? DEFAULT_LATITUDE);
    const longitude = Number(input.longitude ?? DEFAULT_LONGITUDE);
    const radiusKm = Number(input.radiusKm || DEFAULT_RADIUS_KM);
    const latDelta = radiusKm / 111.32;
    const lonDelta = radiusKm / (111.32 * Math.cos(latitude * Math.PI / 180));

    return [
      Number((longitude - lonDelta).toFixed(6)),
      Number((latitude - latDelta).toFixed(6)),
      Number((longitude + lonDelta).toFixed(6)),
      Number((latitude + latDelta).toFixed(6))
    ];
  }

  private static resolveRasterDimensions(bbox: [number, number, number, number]): { width: number; height: number } {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const midLat = (minLat + maxLat) / 2;
    const widthMeters = Math.abs(maxLon - minLon) * 111_320 * Math.cos(midLat * Math.PI / 180);
    const heightMeters = Math.abs(maxLat - minLat) * 111_320;
    const targetMetersPerPixel = 60;
    const maxMetersPerPixel = 1_400;

    const width = this.clampDimension(
      Math.max(
        Math.ceil(widthMeters / targetMetersPerPixel),
        Math.ceil(widthMeters / maxMetersPerPixel)
      )
    );
    const height = this.clampDimension(
      Math.max(
        Math.ceil(heightMeters / targetMetersPerPixel),
        Math.ceil(heightMeters / maxMetersPerPixel)
      )
    );

    return { width, height };
  }

  private static clampDimension(value: number): number {
    return Math.min(512, Math.max(32, value));
  }

  private static resolveRanges(input: NdviRequestInput): { baseline: NdviPeriodInput; current: NdviPeriodInput } {
    if (input.baseline?.from && input.baseline?.to && input.current?.from && input.current?.to) {
      return {
        baseline: input.baseline,
        current: input.current
      };
    }

    const now = new Date();
    const currentTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const currentFrom = new Date(currentTo);
    currentFrom.setUTCDate(currentFrom.getUTCDate() - 30);

    const baselineTo = new Date(currentTo);
    baselineTo.setUTCMonth(baselineTo.getUTCMonth() - 3);
    const baselineFrom = new Date(baselineTo);
    baselineFrom.setUTCDate(baselineFrom.getUTCDate() - 30);

    return {
      baseline: {
        from: this.toIsoStart(baselineFrom),
        to: this.toIsoEnd(baselineTo)
      },
      current: {
        from: this.toIsoStart(currentFrom),
        to: this.toIsoEnd(currentTo)
      }
    };
  }

  private static buildMockResult(
    bbox: [number, number, number, number],
    baselineRange: NdviPeriodInput,
    currentRange: NdviPeriodInput,
    declaredTonnage: number,
    warning: string
  ): NdviComparisonResult {
    const baseline: NdviPeriodResult = {
      ...baselineRange,
      meanNdvi: 0.64,
      cloudCoveragePct: 18.7,
      captureDate: baselineRange.to.slice(0, 10)
    };
    const current: NdviPeriodResult = {
      ...currentRange,
      meanNdvi: 0.82,
      cloudCoveragePct: 12.4,
      captureDate: currentRange.to.slice(0, 10)
    };
    const ndviDelta = Number((current.meanNdvi - baseline.meanNdvi).toFixed(3));

    return {
      source: 'mock',
      configured: this.isConfigured(),
      bbox,
      baseline,
      current,
      meanNdvi: current.meanNdvi,
      ndviDelta,
      cloudCoveragePct: current.cloudCoveragePct,
      captureDate: current.captureDate,
      calculatedSatelliteTonnage: this.calculateSatelliteTonnage(ndviDelta, declaredTonnage),
      warning
    };
  }

  private static calculateSatelliteTonnage(ndviDelta: number, declaredTonnage: number): number {
    if (ndviDelta < 0) {
      return Math.max(50, Math.round(declaredTonnage * Math.max(0.1, 0.25 + ndviDelta)));
    }

    return Math.round(declaredTonnage * Math.min(1.05, 0.9 + ndviDelta * 0.5));
  }

  private static toIsoStart(date: Date): string {
    return `${date.toISOString().slice(0, 10)}T00:00:00Z`;
  }

  private static toIsoEnd(date: Date): string {
    return `${date.toISOString().slice(0, 10)}T23:59:59Z`;
  }
}
