export interface CutterApiPage<T = any> {
  total?: number
  totoal?: number
  pageCount?: number
  numPerPage?: number
  currentPage?: number
  pageNum?: number
  rows?: T[]
  data?: T[]
  recordList?: T[]
}

export interface CutterCabinetRaw {
  cutting_no?: string
  cutting_name?: string
  cuttingNo?: string
  cuttingName?: string
  [key: string]: any
}

export interface CutterMaterialRaw {
  id?: number | string
  brand_name?: string
  brandName?: string
  product_name?: string
  productName?: string
  specification?: string
  inventory?: number | string
  material_code?: string
  materialCode?: string
  cutter_type?: string
  cutterType?: string
  imgUrls?: string | string[]
  img_url?: string
  imgUrl?: string
  price?: number | string
  inventory_warn?: number | string
  inventoryWarn?: number | string
  [key: string]: any
}

export interface CutterCargoSlotRaw {
  id?: number | string
  inventory?: number | string
  surplus?: number | string
  itme_no?: string
  itmeNo?: string
  item_no_alias?: string
  itemNoAlias?: string
  item_no_prefix?: string
  itemNoPrefix?: string
  dis_item_no?: number | string
  disItemNo?: number | string
  bind_num?: number | string
  bindNum?: number | string
  rwarn_num?: number | string
  rwarnNum?: number | string
  cutting_no?: string
  cuttingNo?: string
  cutting_name?: string
  cuttingName?: string
  material_code?: string
  materialCode?: string
  brand_name?: string
  brandName?: string
  product_name?: string
  productName?: string
  specification?: string
  cutter_type?: string
  cutterType?: string
  cutting_tools_brand_id?: number | string
  cuttingToolsBrandId?: number | string
  [key: string]: any
}

export interface CutterItemWarningRaw {
  surplus?: number | string
  inventory?: number | string
  itemNoAlias?: string
  item_no_alias?: string
  materialCode?: string
  material_code?: string
  warnValue?: number | string
  warn_value?: number | string
  productName?: string
  product_name?: string
  brandName?: string
  brand_name?: string
  specification?: string
  cutterType?: string
  cutter_type?: string
  bindNum?: number | string
  bind_num?: number | string
  cuttingNo?: string
  cutting_no?: string
  cuttingName?: string
  cutting_name?: string
  [key: string]: any
}

export interface CutterCabinet {
  cuttingNo: string
  cuttingName: string
  raw?: CutterCabinetRaw
}

export interface CutterMaterial {
  id?: number
  productName: string
  brandName: string
  specification: string
  materialCode: string
  cutterType: string
  inventory: number
  inventoryWarn: number
  price: number
  inventoryValue: number
  imageUrl: string
  raw?: CutterMaterialRaw
}

export interface CutterCargoSlot {
  id?: number
  cuttingNo: string
  cuttingName: string
  itemNo: string
  itemNoAlias: string
  itemNoPrefix: string
  inventory: number
  surplus: number
  bindNum: number
  warnValue: number
  disabled: boolean
  empty: boolean
  materialCode: string
  productName: string
  brandName: string
  specification: string
  cutterType: string
  raw?: CutterCargoSlotRaw
}

export interface CutterInventoryWarning {
  id?: number
  source: 'material' | 'slot'
  cuttingNo: string
  cuttingName: string
  itemNoAlias: string
  materialCode: string
  productName: string
  brandName: string
  specification: string
  cutterType: string
  inventory: number
  warnValue: number
  bindNum: number
  shortage: number
  level: 'empty' | 'low'
  raw?: CutterMaterialRaw | CutterItemWarningRaw
}

export interface CutterBorrowRecordRaw {
  id?: number | string
  brand_name?: string
  brandName?: string
  cutter_type?: string
  cutterType?: string
  cutting_name?: string
  cuttingName?: string
  cutting_no?: string
  cuttingNo?: string
  depart_name?: string
  departName?: string
  item_no_alias?: string
  itemNoAlias?: string
  material_code?: string
  materialCode?: string
  pay_num?: number | string
  payNum?: number | string
  pay_time?: string
  payTime?: string
  price?: number | string
  product_name?: string
  productName?: string
  specification?: string
  user_id?: number | string
  userId?: number | string
  user_name?: string
  userName?: string
  worke_no?: string
  workeNo?: string
  r_user_id?: number | string
  rUserId?: number | string
  r_user_name?: string
  rUserName?: string
  r_worke_no?: string
  rWorkeNo?: string
  workshop_name?: string
  workshopName?: string
  is_return?: number | string
  isReturn?: number | string
  is_confirm?: number | string
  isConfirm?: number | string
  manager_comfirm?: string
  managerComfirm?: string
  manager_id?: number | string
  managerId?: number | string
  comfirm_time?: string
  comfirmTime?: string
  return_time?: string
  returnTime?: string
  [key: string]: any
}

export interface CutterBorrowRecord {
  id?: number
  userId: string
  userName: string
  workNo: string
  returnUserId: string
  returnUserName: string
  returnWorkNo: string
  departmentName: string
  workshopName: string
  cuttingNo: string
  cuttingName: string
  itemNoAlias: string
  materialCode: string
  productName: string
  brandName: string
  specification: string
  cutterType: string
  payNum: number
  price: number
  amount: number
  payTime: string
  returned: boolean
  confirmStatus: string
  violationReason: string
  confirmTime: string
  returnTime: string
  raw?: CutterBorrowRecordRaw
}

export interface CutterStockChangeRaw {
  id?: number | string
  cCount?: number | string
  c_count?: number | string
  remake?: string
  remark?: string
  remark_i18n?: string
  createTime?: string
  create_time?: string
  createBy?: string
  create_by?: string
  createByWorkNo?: string
  create_by_work_no?: string
  brandId?: number | string
  brandName?: string
  brand_name?: string
  productName?: string
  product_name?: string
  specification?: string
  company?: string
  new_repertory?: number | string
  newRepertory?: number | string
  old_repertory?: number | string
  oldRepertory?: number | string
  cuttingNo?: string
  cutting_no?: string
  cuttingName?: string
  cutting_name?: string
  factoryName?: string
  factory_name?: string
  workshopName?: string
  workshop_name?: string
  itemNoAlias?: string
  item_no_alias?: string
  materialCode?: string
  material_code?: string
  cType?: string
  c_type?: string
  cDetails?: string
  c_details?: string
  [key: string]: any
}

export interface CutterStockChangeRecord {
  id?: number
  changeCount: number
  direction: 'in' | 'out' | 'flat'
  oldInventory: number
  newInventory: number
  remark: string
  createTime: string
  createBy: string
  createByWorkNo: string
  brandId: string
  brandName: string
  productName: string
  specification: string
  cuttingNo: string
  cuttingName: string
  itemNoAlias: string
  materialCode: string
  type: string
  details: string
  workshopName: string
  factoryName: string
  raw?: CutterStockChangeRaw
}

export interface CutterInventoryOverview {
  materialCount: number
  totalInventory: number
  totalValue: number
  warningCount: number
  emptyCount: number
  lowCount: number
}

export interface CutterBorrowQuery {
  startTime: string
  endTime: string
  page?: number
  rows?: number
}

export interface CutterStockChangeQuery {
  startTime: string
  endTime: string
  page?: number
  rows?: number
}

export interface CutterViolationQuery {
  startTime: string
  endTime: string
  page?: number
  rows?: number
  searchType?: string
  managerComfirm?: string
}

export interface CutterCargoInventoryQuery {
  cuttingNo: string
  channelNo?: string
  brandName?: string
  productName?: string
  specification?: string
  materialCode?: string
}

export interface CutterMaterialQuery {
  brandName?: string
  productName?: string
  specification?: string
  materialCode?: string
}

export interface CutterInventoryWarningQuery {
  brandName?: string
  productName?: string
  materialCode?: string
  page?: number
  rows?: number
}
