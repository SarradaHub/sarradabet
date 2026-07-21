import { config } from "../../config/env";
import { ValidationError } from "../../core/errors/AppError";

export interface MercadoPagoInstoreSetupConfig {
  storeExternalId: string;
  storeName: string;
  storeLocation: {
    streetName: string;
    streetNumber: string;
    cityName: string;
    stateName: string;
    latitude: number;
    longitude: number;
    reference?: string;
  };
  posExternalId: string;
  posName: string;
  posCategory?: number;
}

export interface MercadoPagoInstoreRuntimeConfig {
  storeId: number;
  storeExternalId: string;
  posId: number;
  posExternalId: string;
  posUuid: string;
}

export function getMercadoPagoInstoreSetupConfig(): MercadoPagoInstoreSetupConfig {
  return {
    storeExternalId: config.MERCADOPAGO_STORE_EXTERNAL_ID,
    storeName: config.MERCADOPAGO_STORE_NAME,
    storeLocation: {
      streetName: config.MERCADOPAGO_STORE_STREET_NAME,
      streetNumber: config.MERCADOPAGO_STORE_STREET_NUMBER,
      cityName: config.MERCADOPAGO_STORE_CITY_NAME,
      stateName: config.MERCADOPAGO_STORE_STATE_NAME,
      latitude: config.MERCADOPAGO_STORE_LATITUDE,
      longitude: config.MERCADOPAGO_STORE_LONGITUDE,
      reference: config.MERCADOPAGO_STORE_REFERENCE,
    },
    posExternalId: config.MERCADOPAGO_POS_EXTERNAL_ID,
    posName: config.MERCADOPAGO_POS_NAME,
    posCategory: config.MERCADOPAGO_POS_CATEGORY,
  };
}

export function getMercadoPagoInstoreRuntimeConfig(): MercadoPagoInstoreRuntimeConfig {
  const missingFields: string[] = [];

  if (config.MERCADOPAGO_STORE_ID === undefined) {
    missingFields.push("MERCADOPAGO_STORE_ID");
  }
  if (config.MERCADOPAGO_POS_ID === undefined) {
    missingFields.push("MERCADOPAGO_POS_ID");
  }
  if (!config.MERCADOPAGO_POS_UUID) {
    missingFields.push("MERCADOPAGO_POS_UUID");
  }

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing Mercado Pago instore runtime environment variables: ${missingFields.join(", ")}. Run npm run mp:setup-store first.`,
    );
  }

  return {
    storeId: config.MERCADOPAGO_STORE_ID!,
    storeExternalId: config.MERCADOPAGO_STORE_EXTERNAL_ID,
    posId: config.MERCADOPAGO_POS_ID!,
    posExternalId: config.MERCADOPAGO_POS_EXTERNAL_ID,
    posUuid: config.MERCADOPAGO_POS_UUID!,
  };
}
