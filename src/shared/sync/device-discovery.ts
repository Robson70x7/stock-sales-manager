import { SyncDevice } from './types';
import { DeviceInfo } from 'react-native-device-info';

const SCAN_PORT = 9999;
const BATCH_SIZE = 20;
const CONNECT_TIMEOUT = 300;
const DEVICE_TTL = 30000;
const MAX_FAIL_COUNT = 3;
const FALLBACK_SUBNETS = ['192.168.1.', '192.168.0.', '10.0.0.'];

export class DeviceDiscoveryService {
  private devices: Map<string, SyncDevice> = new Map();
  private updateCallbacks: ((devices: SyncDevice[]) => void)[] = [];
  private isRunning = false;
  private manualDevices: Map<string, SyncDevice> = new Map();
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private abortScan = false;
  private scanFailCount = 0;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortScan = false;
    this.scanFailCount = 0;
    await this.runScan();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.abortScan = true;
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    this.devices.clear();
    this.manualDevices.clear();
    this.notifyUpdate();
  }

  async runOnce(): Promise<SyncDevice[]> {
    this.abortScan = false;
    this.isRunning = true;
    await this.runScan();
    this.isRunning = false;
    return this.getDevices();
  }

  private scheduleScan(): void {
    if (!this.isRunning) return;
    this.scanTimer = setTimeout(() => this.runScan(), 500);
  }

  private getSubnets(): string[] {
    const subnets: string[] = [];
    for (const sub of FALLBACK_SUBNETS) {
      for (let i = 1; i <= 254; i++) {
        subnets.push(sub + i);
      }
    }
    return subnets;
  }

  private getSubnetFromIp(ip: string): string[] {
    const lastDot = ip.lastIndexOf('.');
    if (lastDot === -1) return [];

    const subnet = ip.substring(0, lastDot + 1);
    const octet = parseInt(ip.substring(lastDot + 1), 10);
    const ips: string[] = [];
    for (let i = 1; i <= 254; i++) {
      if (i === octet) continue;
      ips.push(subnet + i);
    }
    return ips;
  }

  private async runScan(): Promise<void> {
    if (!this.isRunning) return;
    this.abortScan = false;

    let ips: string[] = [];

    try {
      const localIp = await DeviceInfo.getIpAddress();

      if (localIp && localIp !== 'unknown' && localIp.includes('.')) {
        ips = this.getSubnetFromIp(localIp);
      }
    } catch {
      console.warn('[Discovery] Não foi possível obter IP local');
    }

    if (ips.length === 0) {
      this.scanFailCount++;
      if (this.scanFailCount > MAX_FAIL_COUNT) {
        console.warn(`[Discovery] Falha ao obter IP após ${MAX_FAIL_COUNT} tentativas, parando scan`);
        this.isRunning = false;
        return;
      }
      ips = this.getSubnets();
    } else {
      this.scanFailCount = 0;
    }

    await this.scanIps(ips);
    this.purgeStaleDevices();
  }

  private async scanIps(ips: string[]): Promise<void> {
    for (let i = 0; i < ips.length && !this.abortScan; i += BATCH_SIZE) {
      const batch = ips.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(ip => this.tryConnect(ip)));
    }
  }

  private tryConnect(ip: string): Promise<void> {
    return new Promise(resolve => {
      let resolved = false;

      const ws = new WebSocket(`ws://${ip}:${SCAN_PORT}`);

      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          resolve();
        }
      }, CONNECT_TIMEOUT);

      ws.onopen = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);

        const id = `lan-${ip.replace(/\./g, '-')}`;
        const device: SyncDevice = {
          id,
          name: `Desktop (${ip})`,
          type: 'desktop',
          ip,
          port: SCAN_PORT,
          lastSeen: Date.now(),
        };
        this.addDevice(device);

        setTimeout(() => {
          ws.close();
          resolve();
        }, 50);
      };

      ws.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve();
        }
      };
    });
  }

  private purgeStaleDevices(): void {
    const now = Date.now();
    for (const [id, device] of this.devices) {
      if (this.manualDevices.has(id)) continue;
      if (now - device.lastSeen > DEVICE_TTL) {
        this.devices.delete(id);
      }
    }
    this.notifyUpdate();
  }

  addDevice(device: SyncDevice): void {
    this.devices.set(device.id, { ...device, lastSeen: Date.now() });
    this.notifyUpdate();
  }

  removeDevice(deviceId: string): void {
    this.devices.delete(deviceId);
    this.notifyUpdate();
  }

  updateDeviceSeen(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = Date.now();
    }
  }

  getDevices(): SyncDevice[] {
    return Array.from(this.devices.values());
  }

  addManualDevice(ip: string, name?: string): SyncDevice {
    const id = `manual-${ip.replace(/\./g, '-')}`;
    const device: SyncDevice = {
      id,
      name: name || `Desktop (${ip})`,
      type: 'desktop',
      ip,
      port: SCAN_PORT,
      lastSeen: Date.now(),
    };
    this.manualDevices.set(id, device);
    this.addDevice(device);
    return device;
  }

  removeManualDevice(ip: string): void {
    const id = `manual-${ip.replace(/\./g, '-')}`;
    this.manualDevices.delete(id);
    this.removeDevice(id);
  }

  onDevicesChange(callback: (devices: SyncDevice[]) => void): void {
    this.updateCallbacks.push(callback);
  }

  isScanning(): boolean {
    return this.isRunning;
  }

  private notifyUpdate(): void {
    const devices = this.getDevices();
    this.updateCallbacks.forEach(cb => cb(devices));
  }
}
