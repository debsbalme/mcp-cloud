import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'dummy-key') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  });
});

// 2. Auth config info
app.get('/api/auth/config', (req, res) => {
  res.json({
    defaultClientId: process.env.GOOGLE_CLIENT_ID || '',
    appUrl: process.env.APP_URL || '',
  });
});

// 3. MCP Tool Definitions
const MCP_TOOL_DEFINITIONS = [
  {
    name: 'ga4_run_report',
    description: 'Query Google Analytics 4 report data for a property with custom dimensions, metrics, date ranges, sorting, and filters.',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The GA4 Property ID (numeric, e.g. "318492041" or "properties/318492041").'
        },
        dateRanges: {
          type: 'array',
          description: 'Date ranges to query. Formats: "30daysAgo", "7daysAgo", "yesterday", "today", or "YYYY-MM-DD".',
          items: {
            type: 'object',
            properties: {
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              name: { type: 'string' }
            },
            required: ['startDate', 'endDate']
          }
        },
        dimensions: {
          type: 'array',
          description: 'List of dimensions (e.g. date, sessionSourceMedium, sessionDefaultChannelGroup, country, city, deviceCategory, pageTitle, landingPagePlusQueryString).',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            },
            required: ['name']
          }
        },
        metrics: {
          type: 'array',
          description: 'List of metrics (e.g. activeUsers, newUsers, sessions, screenPageViews, conversions, totalRevenue, eventCount, bounceRate, averageSessionDuration).',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' }
            },
            required: ['name']
          }
        },
        orderBys: {
          type: 'array',
          description: 'Sorting order for metrics or dimensions.',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'object', properties: { metricName: { type: 'string' } } },
              dimension: { type: 'object', properties: { dimensionName: { type: 'string' } } },
              desc: { type: 'boolean' }
            }
          }
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of rows to return (default 50).'
        }
      },
      required: ['propertyId', 'dateRanges', 'metrics']
    }
  },
  {
    name: 'ga4_run_realtime_report',
    description: 'Fetch real-time active users and events on the website/app in the last 30 minutes.',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'The GA4 Property ID (numeric, e.g. "318492041" or "properties/318492041").'
        },
        dimensions: {
          type: 'array',
          description: 'Dimensions for real-time (e.g. minutesAgo, country, city, unifiedScreenName, deviceCategory).',
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name']
          }
        },
        metrics: {
          type: 'array',
          description: 'Metrics for real-time (e.g. activeUsers, eventCount, conversions).',
          items: {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name']
          }
        },
        limit: {
          type: 'integer',
          description: 'Limit on rows returned.'
        }
      },
      required: ['propertyId', 'metrics']
    }
  },
  {
    name: 'ga4_list_accounts_and_properties',
    description: 'List all GA4 accounts, property IDs, display names, currencies, and time zones accessible to the user via the Google Analytics Admin API.',
    inputSchema: {
      type: 'object',
      properties: {},
    }
  },
  {
    name: 'ga4_get_metadata',
    description: 'Get custom and standard dimension & metric metadata definitions for a given GA4 property.',
    inputSchema: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'GA4 Property ID' }
      },
      required: ['propertyId']
    }
  }
];

// 4. MCP Tools List Endpoint
app.get('/api/mcp/tools', (req, res) => {
  res.json({
    protocolVersion: '2024-11-05',
    tools: MCP_TOOL_DEFINITIONS
  });
});

// Helper to execute GA4 Report via Real Google Analytics Data API v1beta
async function executeGA4Report(
  propertyId: string,
  requestBody: {
    dateRanges?: Array<{ startDate: string; endDate: string }>;
    dimensions?: Array<{ name: string }>;
    metrics?: Array<{ name: string }>;
    orderBys?: Array<unknown>;
    limit?: number;
  },
  accessToken?: string
) {
  const cleanPropId = propertyId.replace(/^properties\//, '');

  if (!accessToken) {
    throw new Error('Authentication required: Please sign in with your Google account to query Google Analytics 4 data.');
  }

  const payload: any = {
    dateRanges: requestBody.dateRanges && requestBody.dateRanges.length > 0 
      ? requestBody.dateRanges 
      : [{ startDate: '30daysAgo', endDate: 'today' }],
    metrics: requestBody.metrics && requestBody.metrics.length > 0
      ? requestBody.metrics
      : [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }],
    limit: requestBody.limit || 100,
  };

  if (requestBody.dimensions && requestBody.dimensions.length > 0) {
    payload.dimensions = requestBody.dimensions;
  }

  if (requestBody.orderBys && requestBody.orderBys.length > 0) {
    payload.orderBys = requestBody.orderBys;
  }

  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr = errText;
    try {
      const errObj = JSON.parse(errText);
      parsedErr = errObj.error?.message || errText;
    } catch {}
    throw new Error(`Google Analytics Data API Error (${response.status}): ${parsedErr}`);
  }

  return await response.json();
}

// Helper to execute GA4 Realtime Report via Real Google Analytics Data API v1beta
async function executeGA4Realtime(
  propertyId: string,
  requestBody: {
    dimensions?: Array<{ name: string }>;
    metrics?: Array<{ name: string }>;
    limit?: number;
  },
  accessToken?: string
) {
  const cleanPropId = propertyId.replace(/^properties\//, '');

  if (!accessToken) {
    throw new Error('Authentication required: Please sign in with your Google account to query real-time analytics data.');
  }

  const payload: any = {
    metrics: requestBody.metrics && requestBody.metrics.length > 0
      ? requestBody.metrics
      : [{ name: 'activeUsers' }],
    limit: requestBody.limit || 30,
  };

  if (requestBody.dimensions && requestBody.dimensions.length > 0) {
    payload.dimensions = requestBody.dimensions;
  } else {
    payload.dimensions = [{ name: 'minutesAgo' }];
  }

  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${cleanPropId}:runRealtimeReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let parsedErr = errText;
    try {
      const errObj = JSON.parse(errText);
      parsedErr = errObj.error?.message || errText;
    } catch {}
    throw new Error(`Realtime API Error (${response.status}): ${parsedErr}`);
  }

  return await response.json();
}

// 5. GA4 Accounts & Properties endpoint (Real Google Analytics Admin API v1beta)
app.get('/api/ga4/accounts', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;

  if (!accessToken) {
    return res.status(401).json({
      accounts: [],
      isLive: false,
      error: 'Authentication required. Please sign in with your Google account.'
    });
  }

  try {
    const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = errText;
      try {
        const errObj = JSON.parse(errText);
        errMsg = errObj.error?.message || errText;
      } catch {}
      return res.status(response.status).json({
        accounts: [],
        isLive: false,
        error: errMsg
      });
    }

    const data = await response.json();
    const accountSummaries = data.accountSummaries || [];

    const accounts = accountSummaries.map((acc: any) => ({
      id: acc.account,
      account: acc.account,
      displayName: acc.displayName || 'Google Analytics Account',
      properties: (acc.propertySummaries || []).map((prop: any) => ({
        id: prop.property,
        propertyId: prop.property.replace(/^properties\//, ''),
        displayName: prop.displayName || `Property ${prop.property}`,
        accountName: acc.displayName,
        accountId: acc.account,
        propertyType: prop.propertyType || 'PROPERTY_TYPE_ORDINARY',
        timeZone: 'UTC',
        currencyCode: 'USD',
        isDemo: false,
      }))
    }));

    return res.json({ accounts, isLive: true });
  } catch (err: any) {
    return res.status(500).json({
      accounts: [],
      isLive: false,
      error: err.message || 'Failed to fetch Google Analytics accounts'
    });
  }
});

// 6. Direct GA4 Report execution endpoint
app.post('/api/ga4/report', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const { propertyId, dateRanges, dimensions, metrics, orderBys, limit } = req.body;

  if (!propertyId) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  try {
    const report = await executeGA4Report(
      propertyId,
      { dateRanges, dimensions, metrics, orderBys, limit },
      accessToken
    );
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to run GA4 report' });
  }
});

// 7. Direct GA4 Realtime execution endpoint
app.post('/api/ga4/realtime', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const { propertyId, dimensions, metrics, limit } = req.body;

  if (!propertyId) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  try {
    const report = await executeGA4Realtime(
      propertyId,
      { dimensions, metrics, limit },
      accessToken
    );
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to run realtime report' });
  }
});

// 8. Model Context Protocol Direct Tool Invocations
app.post('/api/mcp/call', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const { name, arguments: args } = req.body;

  const startTime = Date.now();
  try {
    let result: unknown = null;

    if (name === 'ga4_run_report') {
      result = await executeGA4Report(args.propertyId, args, accessToken);
    } else if (name === 'ga4_run_realtime_report') {
      result = await executeGA4Realtime(args.propertyId, args, accessToken);
    } else if (name === 'ga4_list_accounts_and_properties') {
      if (!accessToken) {
        throw new Error('Authentication required: Sign in with Google to list your GA4 accounts and properties.');
      }
      const accountsRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      result = await accountsRes.json();
    } else if (name === 'ga4_get_metadata') {
      result = {
        propertyId: args.propertyId,
        standardDimensions: ['date', 'sessionSourceMedium', 'sessionDefaultChannelGroup', 'country', 'city', 'deviceCategory', 'pageTitle'],
        standardMetrics: ['activeUsers', 'newUsers', 'sessions', 'screenPageViews', 'conversions', 'totalRevenue', 'bounceRate', 'eventCount']
      };
    } else {
      return res.status(404).json({ error: `Unknown MCP tool: ${name}` });
    }

    res.json({
      toolName: name,
      arguments: args,
      result,
      durationMs: Date.now() - startTime,
      status: 'success'
    });
  } catch (err: any) {
    res.status(500).json({
      toolName: name,
      arguments: args,
      error: err.message || 'MCP tool execution failed',
      durationMs: Date.now() - startTime,
      status: 'error'
    });
  }
});

// Helper to generate content with model fallback on 503/429/404/capacity errors
async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any[];
    config?: any;
  }
) {
  const modelCandidates = [
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite'
  ];

  let lastError: any = null;
  for (const model of modelCandidates) {
    try {
      const resp = await ai.models.generateContent({
        ...params,
        model,
      });
      return { response: resp, modelUsed: model };
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`Model ${model} attempt failed:`, errMsg);
      // If error indicates transient unavailability, rate limiting, or model not found, try next candidate
      if (
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('404') ||
        errMsg.includes('NOT_FOUND')
      ) {
        continue;
      }
      // For any other error, continue trying other models
      continue;
    }
  }
  throw lastError;
}

// Helper to execute direct GA4 query fallback if AI model is temporarily down
async function executeDirectGA4QueryFallback(
  message: string,
  propertyId: string,
  propertyName: string,
  accessToken: string,
  toolCallsLog: any[],
  noticePrefix?: string
) {
  const q = message.toLowerCase();
  let queryDimensions: any[] = [{ name: 'date' }];
  let queryMetrics: any[] = [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }];
  let isRealtime = false;
  let dateRange = [{ startDate: '30daysAgo', endDate: 'today' }];

  if (q.includes('realtime') || q.includes('right now') || q.includes('active now') || q.includes('live users')) {
    isRealtime = true;
    queryDimensions = [{ name: 'minutesAgo' }];
    queryMetrics = [{ name: 'activeUsers' }];
  } else if (q.includes('channel') || q.includes('source') || q.includes('referral') || q.includes('acquisition') || q.includes('traffic')) {
    queryDimensions = [{ name: 'sessionDefaultChannelGroup' }];
    queryMetrics = [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'bounceRate' }];
  } else if (q.includes('country') || q.includes('geography') || q.includes('city') || q.includes('location')) {
    queryDimensions = [{ name: 'country' }];
    queryMetrics = [{ name: 'activeUsers' }, { name: 'sessions' }];
  } else if (q.includes('device') || q.includes('mobile') || q.includes('desktop') || q.includes('tablet')) {
    queryDimensions = [{ name: 'deviceCategory' }];
    queryMetrics = [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'bounceRate' }];
  } else if (q.includes('page') || q.includes('landing') || q.includes('content') || q.includes('url')) {
    queryDimensions = [{ name: 'pageTitle' }];
    queryMetrics = [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'bounceRate' }];
  } else if (q.includes('conversion') || q.includes('revenue') || q.includes('purchase')) {
    queryDimensions = [{ name: 'sessionDefaultChannelGroup' }];
    queryMetrics = [{ name: 'conversions' }, { name: 'totalRevenue' }, { name: 'sessions' }];
  }

  if (q.includes('7 days') || q.includes('7days') || q.includes('week')) {
    dateRange = [{ startDate: '7daysAgo', endDate: 'today' }];
  } else if (q.includes('yesterday')) {
    dateRange = [{ startDate: 'yesterday', endDate: 'yesterday' }];
  } else if (q.includes('90 days') || q.includes('quarter')) {
    dateRange = [{ startDate: '90daysAgo', endDate: 'today' }];
  }

  const callStart = Date.now();
  let liveReport: any;

  if (isRealtime) {
    liveReport = await executeGA4Realtime(propertyId, { dimensions: queryDimensions, metrics: queryMetrics }, accessToken);
    toolCallsLog.push({
      toolName: 'ga4_run_realtime_report',
      arguments: { propertyId, dimensions: queryDimensions, metrics: queryMetrics },
      response: liveReport,
      durationMs: Date.now() - callStart,
      status: 'success'
    });
  } else {
    liveReport = await executeGA4Report(propertyId, {
      dateRanges: dateRange,
      dimensions: queryDimensions,
      metrics: queryMetrics,
      limit: 25
    }, accessToken);
    toolCallsLog.push({
      toolName: 'ga4_run_report',
      arguments: { propertyId, dateRanges: dateRange, dimensions: queryDimensions, metrics: queryMetrics },
      response: liveReport,
      durationMs: Date.now() - callStart,
      status: 'success'
    });
  }

  const dimHeaders = liveReport.dimensionHeaders || [];
  const metHeaders = liveReport.metricHeaders || [];
  const rows = liveReport.rows || [];
  const isTimeSeries = dimHeaders.some((d: any) => d.name === 'date' || d.name === 'minutesAgo');
  const xKey = dimHeaders[0]?.name || 'dimension';

  const chartData = rows.slice(0, 30).map((r: any) => {
    const point: Record<string, any> = {
      [xKey]: r.dimensionValues?.[0]?.value || 'Item'
    };
    metHeaders.forEach((m: any, idx: number) => {
      point[m.name] = Number(r.metricValues?.[idx]?.value || 0);
    });
    return point;
  });

  const primaryMetric = metHeaders[0]?.name || 'activeUsers';
  const secondaryMetric = metHeaders[1]?.name || 'sessions';

  const totalPrimary = rows.reduce((sum: number, r: any) => sum + Number(r.metricValues?.[0]?.value || 0), 0);
  const totalSecondary = metHeaders[1] ? rows.reduce((sum: number, r: any) => sum + Number(r.metricValues?.[1]?.value || 0), 0) : null;

  const kpis = [
    {
      title: primaryMetric === 'activeUsers' ? 'Total Active Users' : primaryMetric,
      value: totalPrimary > 1000 ? `${(totalPrimary / 1000).toFixed(1)}k` : totalPrimary.toLocaleString(),
      change: 'Live Data',
      changeType: 'positive' as const,
      subtitle: `Property: ${propertyName}`
    },
    ...(totalSecondary !== null ? [{
      title: secondaryMetric === 'sessions' ? 'Total Sessions' : secondaryMetric,
      value: totalSecondary > 1000 ? `${(totalSecondary / 1000).toFixed(1)}k` : totalSecondary.toLocaleString(),
      change: 'Live Data',
      changeType: 'positive' as const,
      subtitle: 'Google Analytics 4'
    }] : [])
  ];

  const prefix = noticePrefix ? `${noticePrefix}\n\n` : '';

  return {
    text: `${prefix}### Live GA4 Report for **${propertyName}**\n\nRetrieved **${rows.length} rows** directly from the Google Analytics 4 API:\n\n- **Dimension**: \`${dimHeaders.map((d: any) => d.name).join(', ') || 'None'}\`\n- **Metrics**: \`${metHeaders.map((m: any) => m.name).join(', ')}\`\n- **Date Range**: \`${dateRange[0].startDate} → ${dateRange[0].endDate}\`\n- **Data Source**: Live Google Analytics Data API v1beta`,
    toolCalls: toolCallsLog,
    kpis,
    chart: {
      type: isTimeSeries ? 'line' : 'bar',
      title: `${propertyName} — ${metHeaders.map((m: any) => m.name).join(' & ')} by ${dimHeaders.map((d: any) => d.name).join(', ') || 'Period'}`,
      xAxisKey: xKey,
      dataKeys: [
        { key: primaryMetric, label: primaryMetric, color: '#2563eb' },
        ...(secondaryMetric ? [{ key: secondaryMetric, label: secondaryMetric, color: '#10b981' }] : [])
      ],
      data: chartData
    },
    tableData: {
      headers: [
        ...(dimHeaders.map((d: any) => d.name)),
        ...(metHeaders.map((m: any) => m.name))
      ],
      rows: rows.map((r: any) => [
        ...(r.dimensionValues?.map((d: any) => d.value) || []),
        ...(r.metricValues?.map((m: any) => m.value) || [])
      ]),
      totalRows: rows.length
    },
    rawReportResponse: liveReport
  };
}

// 9. Full Intelligent AI GA4 Chat Handler with Gemini and MCP Tool Calling
app.post('/api/gemini/chat', async (req, res) => {
  const authHeader = req.headers.authorization;
  const accessToken = (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined) || req.body.accessToken;

  const {
    message,
    propertyId = req.body.property?.propertyId,
    propertyName = req.body.property?.displayName || 'Google Analytics 4 Property',
    currency = req.body.property?.currencyCode || 'USD',
    timeZone = req.body.property?.timeZone || 'UTC'
  } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // If user is not authenticated with Google, inform them to connect their account
  if (!accessToken || accessToken === 'demo_token') {
    return res.json({
      text: `### Google Analytics Authentication Required\n\nPlease connect your Google Analytics account to query live data for **${propertyName}**.\n\n1. Click the **"Sign in with Google"** button in the top navigation.\n2. Choose your Google account and grant read permission for Google Analytics.\n3. Your live properties, metrics, and dashboards will load automatically.`,
      toolCalls: [],
      kpis: [],
      chart: undefined,
      tableData: undefined
    });
  }

  if (!propertyId) {
    return res.json({
      text: `### No GA4 Property Selected\n\nPlease select an active Google Analytics 4 property from the property switcher in the top navigation bar.`,
      toolCalls: [],
      kpis: [],
      chart: undefined,
      tableData: undefined
    });
  }

  const toolCallsLog: any[] = [];

  const runReportDecl: FunctionDeclaration = {
    name: 'ga4_run_report',
    description: 'Query Google Analytics 4 report data for a property with custom dimensions, metrics, date ranges, and sorting.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        propertyId: { type: Type.STRING, description: 'The numeric GA4 Property ID' },
        dateRanges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              startDate: { type: Type.STRING },
              endDate: { type: Type.STRING }
            },
            required: ['startDate', 'endDate']
          }
        },
        dimensions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING } },
            required: ['name']
          }
        },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING } },
            required: ['name']
          }
        },
        limit: { type: Type.INTEGER }
      },
      required: ['propertyId', 'metrics']
    }
  };

  const runRealtimeDecl: FunctionDeclaration = {
    name: 'ga4_run_realtime_report',
    description: 'Fetch real-time active users and metrics for a property in the last 30 minutes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        propertyId: { type: Type.STRING, description: 'The numeric GA4 Property ID' },
        dimensions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING } },
            required: ['name']
          }
        },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { name: { type: Type.STRING } },
            required: ['name']
          }
        }
      },
      required: ['propertyId', 'metrics']
    }
  };

  const ai = getGeminiClient();

  if (!ai) {
    try {
      const fallbackResult = await executeDirectGA4QueryFallback(
        message,
        propertyId,
        propertyName,
        accessToken,
        toolCallsLog
      );
      return res.json(fallbackResult);
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to query Google Analytics 4 API' });
    }
  }

  try {
    const systemInstruction = `You are the GA4 MCP (Model Context Protocol) Assistant.
You specialize in querying, analyzing, and explaining live Google Analytics 4 data for web and mobile properties.
Current Active Property Context:
- Property ID: "${propertyId}"
- Property Display Name: "${propertyName}"
- Default Currency: "${currency}"
- Timezone: "${timeZone}"

Your Capabilities:
1. Always utilize the provided GA4 MCP tools (\`ga4_run_report\` or \`ga4_run_realtime_report\`) to query accurate live metrics.
2. Formulate proper GA4 dimensions (e.g. date, sessionDefaultChannelGroup, sessionSourceMedium, country, city, deviceCategory, pageTitle, landingPagePlusQueryString) and metrics (e.g. activeUsers, newUsers, sessions, screenPageViews, conversions, totalRevenue, eventCount, bounceRate, averageSessionDuration).
3. Provide crisp, professional executive summaries with actionable insights, trend comparisons, and highlight key growth opportunities based on the live data.
4. When users ask for real-time traffic, call \`ga4_run_realtime_report\`.
5. Keep explanations direct, concise, and structured with clear Markdown formatting.`;

    let responseWrap;
    try {
      responseWrap = await generateContentWithFallback(ai, {
        contents: [
          { role: 'user', parts: [{ text: `User Query: ${message}` }] }
        ],
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: [runReportDecl, runRealtimeDecl] }]
        }
      });
    } catch (aiErr: any) {
      console.warn('Gemini initial call encountered high demand or failure, falling back to direct GA4 query parser:', aiErr.message);
      const directResult = await executeDirectGA4QueryFallback(
        message,
        propertyId,
        propertyName,
        accessToken,
        toolCallsLog,
        `*(Note: Gemini model service is currently experiencing temporary high demand; your query was processed directly through the Google Analytics 4 Data API)*`
      );
      return res.json(directResult);
    }

    const response = responseWrap.response;
    let latestReportData: any = null;
    let finalAssistantText = '';

    const candidates = response.candidates || [];
    const functionCalls = candidates[0]?.content?.parts?.filter(p => p.functionCall) || [];

    if (functionCalls.length > 0) {
      const functionResponses = [];

      for (const fc of functionCalls) {
        const call = fc.functionCall!;
        const callArgs = (call.args as any) || {};
        const callStart = Date.now();

        let toolResult: any = null;
        let toolError: string | undefined;

        try {
          if (call.name === 'ga4_run_report') {
            const queryPropId = callArgs.propertyId || propertyId;
            toolResult = await executeGA4Report(queryPropId, callArgs, accessToken);
            latestReportData = toolResult;
          } else if (call.name === 'ga4_run_realtime_report') {
            const queryPropId = callArgs.propertyId || propertyId;
            toolResult = await executeGA4Realtime(queryPropId, callArgs, accessToken);
            latestReportData = toolResult;
          }
        } catch (err: any) {
          toolError = err.message;
          toolResult = { error: err.message };
        }

        toolCallsLog.push({
          toolName: call.name,
          arguments: callArgs,
          response: toolResult,
          durationMs: Date.now() - callStart,
          status: toolError ? 'error' : 'success',
          error: toolError
        });

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { output: toolResult }
          }
        });
      }

      try {
        const followUpWrap = await generateContentWithFallback(ai, {
          contents: [
            { role: 'user', parts: [{ text: `User Query: ${message}` }] },
            { role: 'model', parts: functionCalls },
            { role: 'user', parts: functionResponses }
          ],
          config: {
            systemInstruction,
          }
        });
        finalAssistantText = followUpWrap.response.text || 'Analyzed your live GA4 data successfully.';
      } catch (followUpErr: any) {
        console.warn('Followup Gemini call encountered high demand, synthesizing response from GA4 report data:', followUpErr.message);
        finalAssistantText = `### Live GA4 Report Analysis for **${propertyName}**\n\nI have successfully executed the query against your live Google Analytics 4 property:\n\n- **Property**: ${propertyName} (\`${propertyId}\`)\n- **Status**: Retrieved ${latestReportData?.rows?.length || 0} rows of live analytics data.`;
      }
    } else {
      finalAssistantText = response.text || 'Processed your request.';
    }

    if (!latestReportData) {
      // Run default report if no tool call was generated
      latestReportData = await executeGA4Report(
        propertyId,
        {
          dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }]
        },
        accessToken
      );
    }

    const dimHeaders = latestReportData.dimensionHeaders || [];
    const metHeaders = latestReportData.metricHeaders || [];
    const rows = latestReportData.rows || [];

    const isTimeSeries = dimHeaders.some((d: any) => d.name === 'date' || d.name === 'minutesAgo');
    const xKey = dimHeaders[0]?.name || 'dimension';

    const chartData = rows.slice(0, 30).map((r: any) => {
      const point: Record<string, any> = {
        [xKey]: r.dimensionValues?.[0]?.value || 'Item'
      };
      metHeaders.forEach((m: any, idx: number) => {
        point[m.name] = Number(r.metricValues?.[idx]?.value || 0);
      });
      return point;
    });

    const primaryMetric = metHeaders[0]?.name || 'activeUsers';
    const secondaryMetric = metHeaders[1]?.name || 'sessions';

    const kpis = [];
    if (rows.length > 0) {
      const topMetricVal = rows.reduce((sum: number, r: any) => sum + Number(r.metricValues?.[0]?.value || 0), 0);
      kpis.push({
        title: primaryMetric === 'activeUsers' ? 'Total Active Users' : primaryMetric,
        value: topMetricVal > 1000 ? `${(topMetricVal / 1000).toFixed(1)}k` : topMetricVal.toLocaleString(),
        change: 'Live Data',
        changeType: 'positive' as const,
        subtitle: `Selected: ${propertyName}`
      });

      if (metHeaders[1]) {
        const secMetricVal = rows.reduce((sum: number, r: any) => sum + Number(r.metricValues?.[1]?.value || 0), 0);
        kpis.push({
          title: secondaryMetric === 'sessions' ? 'Total Sessions' : secondaryMetric,
          value: secMetricVal > 1000 ? `${(secMetricVal / 1000).toFixed(1)}k` : secMetricVal.toLocaleString(),
          change: 'Live Data',
          changeType: 'positive' as const,
          subtitle: 'Google Analytics 4'
        });
      }
    }

    res.json({
      text: finalAssistantText,
      toolCalls: toolCallsLog,
      kpis,
      chart: {
        type: isTimeSeries ? 'line' : 'bar',
        title: `${propertyName} — ${metHeaders.map((m: any) => m.name).join(' & ')} by ${dimHeaders.map((d: any) => d.name).join(', ')}`,
        xAxisKey: xKey,
        dataKeys: [
          { key: primaryMetric, label: primaryMetric, color: '#2563eb' },
          ...(secondaryMetric ? [{ key: secondaryMetric, label: secondaryMetric, color: '#10b981' }] : [])
        ],
        data: chartData
      },
      tableData: {
        headers: [
          ...(dimHeaders.map((d: any) => d.name)),
          ...(metHeaders.map((m: any) => m.name))
        ],
        rows: rows.map((r: any) => [
          ...(r.dimensionValues?.map((d: any) => d.value) || []),
          ...(r.metricValues?.map((m: any) => m.value) || [])
        ]),
        totalRows: rows.length
      },
      rawReportResponse: latestReportData
    });

  } catch (error: any) {
    console.error('Chat error, running final direct query fallback:', error);
    try {
      const directResult = await executeDirectGA4QueryFallback(
        message,
        propertyId,
        propertyName,
        accessToken,
        toolCallsLog
      );
      return res.json(directResult);
    } catch (finalErr: any) {
      res.status(500).json({ error: finalErr.message || error.message || 'Chat generation failed' });
    }
  }
});

// Vite middleware for development & static serving for production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GA4 MCP Server running on port ${PORT}`);
  });
}

start();
