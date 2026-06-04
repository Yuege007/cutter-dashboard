import type {
  CutterApiPage,
  CutterBorrowRecord,
  CutterBorrowRecordRaw,
  CutterCabinet,
  CutterCabinetRaw,
  CutterCargoSlot,
  CutterCargoSlotRaw,
  CutterInventoryOverview,
  CutterInventoryWarning,
  CutterItemWarningRaw,
  CutterMaterial,
  CutterMaterialRaw,
  CutterStockChangeRaw,
  CutterStockChangeRecord
} from '@/types/cutter'

const toNumber = (value: any, fallback = 0): number => {
  if (value === undefined || value === null || value === '') return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toStringValue = (value: any, fallback = ''): string => {
  if (value === undefined || value === null) return fallback
  return String(value)
}

export const getRows = <T = any>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.recordList)) return payload.recordList
  if (Array.isArray(payload?.itemList)) return payload.itemList
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  if (Array.isArray(payload?.data?.recordList)) return payload.data.recordList
  if (Array.isArray(payload?.data?.itemList)) return payload.data.itemList
  return []
}

export const normalizePage = <T = any>(payload: any): CutterApiPage<T> => {
  const data = payload?.data || payload || {}
  return {
    total: data.total ?? data.totoal ?? getRows<T>(data).length,
    totoal: data.totoal,
    pageCount: data.pageCount,
    numPerPage: data.numPerPage,
    currentPage: data.currentPage,
    pageNum: data.pageNum,
    rows: getRows<T>(data)
  }
}

export const mapCutterCabinet = (raw: CutterCabinetRaw): CutterCabinet => ({
  cuttingNo: toStringValue(raw.cutting_no ?? raw.cuttingNo),
  cuttingName: toStringValue(raw.cutting_name ?? raw.cuttingName ?? raw.cutting_no ?? raw.cuttingNo),
  raw
})

export const mapCutterMaterial = (raw: CutterMaterialRaw): CutterMaterial => {
  const inventory = toNumber(raw.inventory)
  const price = toNumber(raw.price)
  const inventoryWarn = toNumber(raw.inventory_warn ?? raw.inventoryWarn)
  const imageValue = raw.imgUrls ?? raw.img_url ?? raw.imgUrl ?? ''
  const imageUrl = Array.isArray(imageValue) ? toStringValue(imageValue[0]) : toStringValue(imageValue)

  return {
    id: raw.id !== undefined ? toNumber(raw.id) : undefined,
    productName: toStringValue(raw.product_name ?? raw.productName),
    brandName: toStringValue(raw.brand_name ?? raw.brandName),
    specification: toStringValue(raw.specification),
    materialCode: toStringValue(raw.material_code ?? raw.materialCode),
    cutterType: toStringValue(raw.cutter_type ?? raw.cutterType),
    inventory,
    inventoryWarn,
    price,
    inventoryValue: inventory * price,
    imageUrl,
    raw
  }
}

export const mapCutterCargoSlot = (raw: CutterCargoSlotRaw): CutterCargoSlot => {
  const materialId = toNumber(raw.cutting_tools_brand_id ?? raw.cuttingToolsBrandId)
  const surplus = toNumber(raw.surplus)
  const inventory = toNumber(raw.inventory)
  const warnValue = toNumber(raw.rwarn_num ?? raw.rwarnNum)
  const disabled = toNumber(raw.dis_item_no ?? raw.disItemNo, 1) === 2

  return {
    id: raw.id !== undefined ? toNumber(raw.id) : undefined,
    cuttingNo: toStringValue(raw.cutting_no ?? raw.cuttingNo),
    cuttingName: toStringValue(raw.cutting_name ?? raw.cuttingName),
    itemNo: toStringValue(raw.itme_no ?? raw.itmeNo),
    itemNoAlias: toStringValue(raw.item_no_alias ?? raw.itemNoAlias),
    itemNoPrefix: toStringValue(raw.item_no_prefix ?? raw.itemNoPrefix),
    inventory,
    surplus,
    bindNum: toNumber(raw.bind_num ?? raw.bindNum),
    warnValue,
    disabled,
    empty: materialId === 0 || (!raw.product_name && !raw.productName && !raw.material_code && !raw.materialCode),
    materialCode: toStringValue(raw.material_code ?? raw.materialCode),
    productName: toStringValue(raw.product_name ?? raw.productName),
    brandName: toStringValue(raw.brand_name ?? raw.brandName),
    specification: toStringValue(raw.specification),
    cutterType: toStringValue(raw.cutter_type ?? raw.cutterType),
    raw
  }
}

export const mapMaterialWarning = (raw: CutterMaterialRaw): CutterInventoryWarning => {
  const material = mapCutterMaterial(raw)
  const shortage = material.inventoryWarn - material.inventory

  return {
    id: material.id,
    source: 'material',
    cuttingNo: '',
    cuttingName: '',
    itemNoAlias: '',
    materialCode: material.materialCode,
    productName: material.productName,
    brandName: material.brandName,
    specification: material.specification,
    cutterType: material.cutterType,
    inventory: material.inventory,
    warnValue: material.inventoryWarn,
    bindNum: 0,
    shortage,
    level: material.inventory <= 0 ? 'empty' : 'low',
    raw
  }
}

export const mapItemWarning = (raw: CutterItemWarningRaw): CutterInventoryWarning => {
  const inventory = toNumber(raw.surplus)
  const warnValue = toNumber(raw.warnValue ?? raw.warn_value)

  return {
    source: 'slot',
    cuttingNo: toStringValue(raw.cuttingNo ?? raw.cutting_no),
    cuttingName: toStringValue(raw.cuttingName ?? raw.cutting_name),
    itemNoAlias: toStringValue(raw.itemNoAlias ?? raw.item_no_alias),
    materialCode: toStringValue(raw.materialCode ?? raw.material_code),
    productName: toStringValue(raw.productName ?? raw.product_name),
    brandName: toStringValue(raw.brandName ?? raw.brand_name),
    specification: toStringValue(raw.specification),
    cutterType: toStringValue(raw.cutterType ?? raw.cutter_type),
    inventory,
    warnValue,
    bindNum: toNumber(raw.bindNum ?? raw.bind_num),
    shortage: warnValue - inventory,
    level: inventory <= 0 ? 'empty' : 'low',
    raw
  }
}

export const mapBorrowRecord = (raw: CutterBorrowRecordRaw): CutterBorrowRecord => {
  const payNum = toNumber(raw.pay_num ?? raw.payNum)
  const price = toNumber(raw.price)
  const isReturn = toNumber(raw.is_return ?? raw.isReturn)

  return {
    id: raw.id !== undefined ? toNumber(raw.id) : undefined,
    userId: toStringValue(raw.user_id ?? raw.userId),
    userName: toStringValue(raw.user_name ?? raw.userName, '未知人员'),
    workNo: toStringValue(raw.worke_no ?? raw.workeNo),
    returnUserId: toStringValue(raw.r_user_id ?? raw.rUserId),
    returnUserName: toStringValue(raw.r_user_name ?? raw.rUserName),
    returnWorkNo: toStringValue(raw.r_worke_no ?? raw.rWorkeNo),
    departmentName: toStringValue(raw.depart_name ?? raw.departName),
    workshopName: toStringValue(raw.workshop_name ?? raw.workshopName),
    cuttingNo: toStringValue(raw.cutting_no ?? raw.cuttingNo),
    cuttingName: toStringValue(raw.cutting_name ?? raw.cuttingName),
    itemNoAlias: toStringValue(raw.item_no_alias ?? raw.itemNoAlias),
    materialCode: toStringValue(raw.material_code ?? raw.materialCode),
    productName: toStringValue(raw.product_name ?? raw.productName, '未知刀具'),
    brandName: toStringValue(raw.brand_name ?? raw.brandName),
    specification: toStringValue(raw.specification),
    cutterType: toStringValue(raw.cutter_type ?? raw.cutterType),
    payNum,
    price,
    amount: payNum * price,
    payTime: toStringValue(raw.pay_time ?? raw.payTime),
    returned: isReturn === 2,
    confirmStatus: toStringValue(raw.is_confirm ?? raw.isConfirm),
    violationReason: toStringValue(raw.manager_comfirm ?? raw.managerComfirm),
    confirmTime: toStringValue(raw.comfirm_time ?? raw.comfirmTime),
    returnTime: toStringValue(raw.return_time ?? raw.returnTime),
    raw
  }
}

export const mapStockChangeRecord = (raw: CutterStockChangeRaw): CutterStockChangeRecord => {
  const explicitCount = raw.cCount ?? raw.c_count
  const oldInventory = toNumber(raw.old_repertory ?? raw.oldRepertory)
  const newInventory = toNumber(raw.new_repertory ?? raw.newRepertory)
  const changeCount = explicitCount !== undefined && explicitCount !== null && explicitCount !== ''
    ? toNumber(explicitCount)
    : newInventory - oldInventory

  return {
    id: raw.id !== undefined ? toNumber(raw.id) : undefined,
    changeCount,
    direction: changeCount > 0 ? 'in' : changeCount < 0 ? 'out' : 'flat',
    oldInventory,
    newInventory,
    remark: toStringValue(raw.remark_i18n ?? raw.remark ?? raw.remake),
    createTime: toStringValue(raw.createTime ?? raw.create_time),
    createBy: toStringValue(raw.createBy ?? raw.create_by),
    createByWorkNo: toStringValue(raw.createByWorkNo ?? raw.create_by_work_no),
    brandId: toStringValue(raw.brandId),
    brandName: toStringValue(raw.brandName ?? raw.brand_name),
    productName: toStringValue(raw.productName ?? raw.product_name, '未知刀具'),
    specification: toStringValue(raw.specification),
    cuttingNo: toStringValue(raw.cuttingNo ?? raw.cutting_no),
    cuttingName: toStringValue(raw.cuttingName ?? raw.cutting_name),
    itemNoAlias: toStringValue(raw.itemNoAlias ?? raw.item_no_alias),
    materialCode: toStringValue(raw.materialCode ?? raw.material_code),
    type: toStringValue(raw.cType ?? raw.c_type),
    details: toStringValue(raw.cDetails ?? raw.c_details),
    workshopName: toStringValue(raw.workshopName ?? raw.workshop_name),
    factoryName: toStringValue(raw.factoryName ?? raw.factory_name),
    raw
  }
}

export const buildInventoryOverview = (
  materials: CutterMaterial[],
  warnings: CutterInventoryWarning[] = []
): CutterInventoryOverview => ({
  materialCount: materials.length,
  totalInventory: materials.reduce((sum, item) => sum + item.inventory, 0),
  totalValue: materials.reduce((sum, item) => sum + item.inventoryValue, 0),
  warningCount: warnings.length,
  emptyCount: warnings.filter(item => item.level === 'empty').length,
  lowCount: warnings.filter(item => item.level === 'low').length
})

export const cutterAdapter = {
  getRows,
  normalizePage,
  mapCutterCabinet,
  mapCutterMaterial,
  mapCutterCargoSlot,
  mapMaterialWarning,
  mapItemWarning,
  mapBorrowRecord,
  mapStockChangeRecord,
  buildInventoryOverview
}

export default cutterAdapter
