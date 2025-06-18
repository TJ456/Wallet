import { CivicGateway, ImmutableActiveGateState } from '@civic/civic-pass-api';

export class CivicAuthManager {
  private gateway: CivicGateway;
  private gatekeeperNetwork: string;
  private userAddress: string;
  private backendUrl: string;

  constructor(gatekeeperNetwork: string, userAddress: string, backendUrl: string) {
    this.gateway = new CivicGateway();
    this.gatekeeperNetwork = gatekeeperNetwork;
    this.userAddress = userAddress;
    this.backendUrl = backendUrl;
  }

  async initiateCivicAuth(deviceInfo: any): Promise<{gatepass: string, status: string}> {
    try {
      // Request gatepass from backend
      const response = await fetch(`${this.backendUrl}/api/auth/civic/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: this.userAddress,
          deviceInfo: JSON.stringify(deviceInfo),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Civic authentication');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Civic auth initiation failed:', error);
      throw error;
    }
  }

  async verifyCivicGatepass(gatepass: string, deviceInfo: any): Promise<{status: string, securityLevel: number}> {
    try {
      // Verify gatepass with backend
      const response = await fetch(`${this.backendUrl}/api/auth/civic/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress: this.userAddress,
          gatepass: gatepass,
          deviceInfo: JSON.stringify(deviceInfo),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.requiresAdditionalVerification) {
          throw new Error('Additional verification required');
        }
        throw new Error(error.error || 'Verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Civic verification failed:', error);
      throw error;
    }
  }

  async checkAuthStatus(): Promise<{
    status: string;
    securityLevel: number;
    riskScore: number;
    securityFlags: string[];
  }> {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/auth/civic/status?userAddress=${this.userAddress}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to check auth status');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check auth status:', error);
      throw error;
    }
  }

  // Helper method to collect device information
  static collectDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
    };
  }
}
