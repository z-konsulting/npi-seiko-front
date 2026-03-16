export enum MaterialFormField {
  MANUFACTURER = "manufacturer",
  MANUFACTURER_PART_NUMBER = "manufacturerPartNumber",
  DESCRIPTION = "description",
  CATEGORY = "category",
  UNIT = "unit",
  SUPPLIER = "suppliers",
}

export enum MaterialSupplierFormField {
  SUPPLIER = "supplier",
  SHIPMENT_METHOD = "shipmentMethod",
  PURCHASING_CURRENCY = "purchasingCurrency",
  DEFAULT_SUPPLIER = "defaultSupplier",
  MOQ_LINES = "moqLines",
}

export enum MaterialSupplierMoqLineFormField {
  MINIMUM_ORDER_QUANTITY = "minimumOrderQuantity",
  PRICE = "unitPurchasingPriceInPurchasingCurrency",
  LEAD_TIME = "leadTime",
}
