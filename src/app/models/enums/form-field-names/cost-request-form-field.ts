export enum CostRequestFormField {
  CUSTOMER = "customer",
  CUSTOMER_EMAILS = "customerEmails",
  REQUESTOR_NAME = "requestorName",
  PROJECT_NAME = "projectName",
  PURCHASE_ORDER_EXPECTED_DATE = "purchaseOrderExpectedDate",
  CURRENCY = "currency",
  LINES = "lines",
}

export enum CostRequestLineFormField {
  CUSTOMER_PART_NUMBER = "customerPartNumber",
  CUSTOMER_PART_NUMBER_REVISION = "customerPartNumberRevision",
  DESCRIPTION = "description",
  PRODUCT_NAME = "productName",
  QUANTITIES = "quantities",
  CR_METHOD_TYPE = "costingMethodType",
  FILES = "files",
  MATERIAL_LINES = "materialLines",
}

export enum CostRequestLineMaterialFormField {
  MATERIAL_EXISTS = "materialExists",
  MANUFACTURER = "manufacturer",
  MANUFACTURER_PART_NUMBER = "manufacturerPartNumber",
  DESCRIPTION = "description",
  CATEGORY = "category",
  UNIT = "unit",
  MATERIAL_TYPE = "materialType",
  QUANTITY = "quantity",
}
