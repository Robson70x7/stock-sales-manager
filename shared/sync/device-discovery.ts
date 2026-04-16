/**
 * Serviço de descoberta de dispositivos na rede local
 * Usa mDNS (Bonjour) para encontrar outros dispositivos VendaFácil
 */

import { SyncDevice } from './types';

export class DeviceDiscoveryService {
  private devices: Map<string, SyncDevice> = new Map();
  private serviceType = '_vendafacil._tcp.local';
  private updateCallbacks: ((devices: SyncDevice[]) => void)[] = [];

  /**
   * Iniciar descoberta de dispositivos
   */
  async start(): Promise<void> {
    console.log('[Discovery] Iniciando descoberta de dispositivos...');
    
    // Implementação específica de plataforma será feita em adapters
    // Mobile: usar react-native-mdns-sd
    // Desktop: usar mdns ou bonjour-service
  }

  /**
   * Parar descoberta
   */
  async stop(): Promise<void> {
    console.log('[Discovery] Parando descoberta...');
    this.devices.clear();
    this.notifyUpdate();
  }

  /**
   * Adicionar dispositivo descoberto
   */
  addDevice(device: SyncDevice): void {
    this.devices.set(device.id, device);
    this.notifyUpdate();
  }

  /**
   * Remover dispositivo
   */
  removeDevice(deviceId: string): void {
    this.devices.delete(deviceId);
    this.notifyUpdate();
  }

  /**
   * Atualizar último visto de um dispositivo
   */
  updateDeviceSeen(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeen = Date.now();
    }
  }

  /**
   * Obter todos os dispositivos
   */
  getDevices(): SyncDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Registrar callback para mudanças
   */
  onDevicesChange(callback: (devices: SyncDevice[]) => void): void {
    this.updateCallbacks.push(callback);
  }

  private notifyUpdate(): void {
    const devices = this.getDevices();
    this.updateCallbacks.forEach(cb => cb(devices));
  }
}
