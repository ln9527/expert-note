import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Alibaba Cloud API signature helper
function signRequest(
  accessKeyId: string,
  accessKeySecret: string,
  params: Record<string, string>
): string {
  // Sort parameters
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Create string to sign
  const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(sortedParams)}`;

  // Calculate signature using HMAC-SHA1
  const signature = crypto
    .createHmac('sha1', accessKeySecret + '&')
    .update(stringToSign)
    .digest('base64');

  return signature;
}

// Generate a random nonce
function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

// Format date for Alibaba Cloud API
function formatDate(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export async function GET() {
  try {
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

    if (!accessKeyId || !accessKeySecret) {
      return NextResponse.json(
        { error: 'ASR credentials not configured' },
        { status: 500 }
      );
    }

    // Build request parameters for getting token
    const params: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'CreateToken',
      Format: 'JSON',
      RegionId: 'cn-shanghai',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: generateNonce(),
      SignatureVersion: '1.0',
      Timestamp: formatDate(),
      Version: '2019-02-28',
    };

    // Calculate signature
    const signature = signRequest(accessKeyId, accessKeySecret, params);
    params.Signature = signature;

    // Build request URL
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = `https://nls-meta.cn-shanghai.aliyuncs.com/?${queryString}`;

    // Make request to Alibaba Cloud
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alibaba Cloud token request failed:', errorText);
      return NextResponse.json(
        { error: 'Failed to get ASR token' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.Token) {
      return NextResponse.json({
        token: data.Token.Id,
        expireTime: data.Token.ExpireTime * 1000, // Convert to milliseconds
      });
    } else {
      console.error('Unexpected token response:', data);
      return NextResponse.json(
        { error: 'Invalid token response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
