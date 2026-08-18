export type AuthMode = 'google_gsi' | 'custom_oauth' | 'custom_token' | 'demo_mode';

export interface UserProfile {
  name: string;
  email: string;
  picture?: string;
  accessToken?: string;
  tokenExpiry?: number;
  authMode: AuthMode;
  customClientId?: string;
}

export interface GA4Property {
  id: string; // e.g. "properties/318492041" or "318492041"
  propertyId: string; // numeric ID
  displayName: string;
  accountName?: string;
  accountId?: string;
  industryCategory?: string;
  timeZone: string;
  currencyCode: string;
  propertyType?: string;
  createTime?: string;
  isDemo?: boolean;
}

export interface GA4Account {
  id: string;
  account: string;
  displayName: string;
  properties: GA4Property[];
}

export interface GA4DateRange {
  startDate: string; // '2025-01-01' or '30daysAgo' or 'yesterday'
  endDate: string; // 'today' or '2025-01-31'
  name?: string;
}

export interface GA4Dimension {
  name: string; // e.g. 'date', 'sessionSourceMedium', 'country', 'deviceCategory'
}

export interface GA4Metric {
  name: string; // e.g. 'activeUsers', 'sessions', 'screenPageViews', 'conversions'
}

export interface GA4OrderBy {
  metric?: { metricName: string };
  dimension?: { dimensionName: string };
  desc?: boolean;
}

export interface GA4ReportRequest {
  propertyId: string;
  dateRanges: GA4DateRange[];
  dimensions?: GA4Dimension[];
  metrics: GA4Metric[];
  orderBys?: GA4OrderBy[];
  limit?: number;
  offset?: number;
  keepEmptyRows?: boolean;
}

export interface GA4RealtimeRequest {
  propertyId: string;
  dimensions?: GA4Dimension[];
  metrics: GA4Metric[];
  limit?: number;
}

export interface DimensionHeader {
  name: string;
}

export interface MetricHeader {
  name: string;
  type: string;
}

export interface DimensionValue {
  value: string;
}

export interface MetricValue {
  value: string;
}

export interface RowItem {
  dimensionValues?: DimensionValue[];
  metricValues?: MetricValue[];
}

export interface GA4ReportResponse {
  dimensionHeaders?: DimensionHeader[];
  metricHeaders?: MetricHeader[];
  rows?: RowItem[];
  totals?: Array<{ metricValues: MetricValue[] }>;
  maximums?: Array<{ metricValues: MetricValue[] }>;
  minimums?: Array<{ metricValues: MetricValue[] }>;
  rowCount?: number;
  metadata?: {
    currencyCode?: string;
    timeZone?: string;
    samplingMetadatas?: unknown[];
  };
  kind?: string;
}

export interface ChartVisualizationConfig {
  type: 'line' | 'bar' | 'area' | 'pie';
  title: string;
  xAxisKey: string;
  dataKeys: {
    key: string;
    label: string;
    color: string;
  }[];
  data: Array<Record<string, string | number>>;
}

export interface KPICardData {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

export interface MCPToolCallInfo {
  toolName: string;
  arguments: Record<string, unknown>;
  response?: unknown;
  durationMs?: number;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: MCPToolCallInfo[];
  kpis?: KPICardData[];
  chart?: ChartVisualizationConfig;
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
    totalRows: number;
  };
  rawReportResponse?: GA4ReportResponse;
  propertyContext?: {
    id: string;
    name: string;
  };
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
