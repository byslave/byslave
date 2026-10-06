/**
 * Web Bluetooth tipleri. Tarayıcıda var, TypeScript lib'inde her zaman yok.
 */
export {};

declare global {
  interface Bluetooth {
    requestDevice(options: {
      filters?: { services?: (number | string)[]; name?: string }[];
      optionalServices?: (number | string)[];
      acceptAllDevices?: boolean;
    }): Promise<BluetoothDevice>;
  }

  interface BluetoothDevice extends EventTarget {
    readonly name?: string | null;
    readonly gatt?: BluetoothRemoteGATTServer;
  }

  interface BluetoothRemoteGATTServer {
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTServer>;
    disconnect(): void;
    getPrimaryService(service: number | string): Promise<BluetoothRemoteGATTService>;
  }

  interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: number | string): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface BluetoothRemoteGATTCharacteristic extends EventTarget {
    readonly value?: DataView;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  }

  interface Navigator {
    bluetooth?: Bluetooth;
  }
}
