export interface MercadoPagoBusinessHoursSlot {
  open: string;
  close: string;
}

export type MercadoPagoBusinessHours = Partial<
  Record<
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday",
    MercadoPagoBusinessHoursSlot[]
  >
>;

export interface MercadoPagoStoreLocation {
  street_number: string;
  street_name: string;
  city_name: string;
  state_name: string;
  latitude: number;
  longitude: number;
  reference?: string;
}

export interface CreateMercadoPagoStoreInput {
  name: string;
  external_id: string;
  location: MercadoPagoStoreLocation;
  business_hours?: MercadoPagoBusinessHours;
}

export interface MercadoPagoStoreResponse {
  id: number;
  name: string;
  external_id: string;
  date_created?: string;
  business_hours?: MercadoPagoBusinessHours;
  location?: MercadoPagoStoreLocation & { address_line?: string };
}

export interface MercadoPagoStoreSearchResponse {
  paging?: {
    total: number;
    offset: number;
    limit: number;
  };
  results?: Array<Omit<MercadoPagoStoreResponse, "id"> & { id: number | string }>;
}

export interface CreateMercadoPagoPosInput {
  name: string;
  fixed_amount: boolean;
  store_id: number;
  external_store_id: string;
  external_id: string;
  category?: number;
}

export interface MercadoPagoPosQr {
  image?: string;
  template_document?: string;
  template_image?: string;
}

export interface MercadoPagoPosResponse {
  id: number;
  name: string;
  fixed_amount: boolean;
  store_id: number;
  external_store_id: string;
  external_id: string;
  uuid?: string;
  status?: string;
  category?: number;
  user_id?: number;
  qr?: MercadoPagoPosQr;
  date_created?: string;
  date_last_updated?: string;
}

export interface MercadoPagoPosSearchResponse {
  paging?: {
    total: number;
    offset: number;
    limit: number;
  };
  results?: MercadoPagoPosResponse[];
}
