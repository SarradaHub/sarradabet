declare module "consul" {
  export interface ConsulOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    defaults?: unknown;
    promisify?: boolean | ((fn: Function) => Function);
  }

  export interface ServiceCheck {
    http?: string;
    interval?: string;
    timeout?: string;
    deregistercriticalserviceafter?: string;
  }

  export interface ServiceRegisterOptions {
    name: string;
    id?: string;
    address?: string;
    port?: number;
    tags?: string[];
    check?: ServiceCheck;
  }

  export interface HealthServiceOptions {
    service: string;
    passing?: boolean;
  }

  export interface Service {
    Address: string;
    Port: number;
  }

  export interface HealthServiceResult {
    Service: Service;
  }

  export interface Agent {
    service: {
      register(options: ServiceRegisterOptions): Promise<void>;
      deregister(serviceId: string): Promise<void>;
    };
  }

  export interface Health {
    service(options: HealthServiceOptions): Promise<HealthServiceResult[]>;
  }

  export class Consul {
    agent: Agent;
    health: Health;

    constructor(options?: ConsulOptions);
  }

  const ConsulClass: typeof Consul;
  export = ConsulClass;
}

