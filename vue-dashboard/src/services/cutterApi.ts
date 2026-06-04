import http from './http'
import type { ApiResponse } from '@/types'
import type {
  CutterCabinetRaw,
  CutterBorrowQuery,
  CutterBorrowRecordRaw,
  CutterCargoInventoryQuery,
  CutterCargoSlotRaw,
  CutterInventoryWarningQuery,
  CutterItemWarningRaw,
  CutterMaterialQuery,
  CutterMaterialRaw,
  CutterStockChangeQuery,
  CutterStockChangeRaw,
  CutterViolationQuery
} from '@/types/cutter'

const getToken = () => {
  try {
    return localStorage.getItem('auth_token') || undefined
  } catch {
    return undefined
  }
}

const withToken = (params: Record<string, any> = {}) => ({
  ...params,
  token: params.token ?? getToken()
})

const cleanParams = (params: Record<string, any>) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export const cutterCabinetApi = {
  getCabinets: () =>
    http.get<CutterCabinetRaw[]>('/plat/cutterApi/searchCabinetInfo', cleanParams(withToken())),

  getCargoInventory: (query: CutterCargoInventoryQuery) =>
    http.get<CutterCargoSlotRaw[] | { rows?: CutterCargoSlotRaw[]; data?: CutterCargoSlotRaw[] }>(
      '/plat/cutterApi/cargoInventory',
      cleanParams(withToken({
        cutting_no: query.cuttingNo,
        channel_no: query.channelNo,
        brand_name: query.brandName,
        product_name: query.productName,
        specification: query.specification,
        material_code: query.materialCode
      }))
    ),

  getItemWarnings: (cuttingNo: string) =>
    http.get<CutterItemWarningRaw[] | { rows?: CutterItemWarningRaw[]; data?: CutterItemWarningRaw[] }>(
      '/plat/cutterApi/searchItemWarn',
      cleanParams(withToken({ cuttingNo }))
    )
}

export const cutterMaterialApi = {
  getMaterials: (query: CutterMaterialQuery = {}) =>
    http.get<CutterMaterialRaw[] | { rows?: CutterMaterialRaw[]; data?: CutterMaterialRaw[] }>(
      '/plat/cutterApi/consumablesInventory',
      cleanParams(withToken({
        brand_name: query.brandName,
        product_name: query.productName,
        specification: query.specification,
        material_code: query.materialCode
      }))
    ),

  getInventoryWarnings: (query: CutterInventoryWarningQuery = {}) =>
    http.get<{ rows?: CutterMaterialRaw[]; data?: CutterMaterialRaw[]; total?: number; totoal?: number }>(
      '/plat/cutterApi/consumableInventoryEarlyWarning',
      cleanParams(withToken({
        brand_name: query.brandName,
        product_name: query.productName,
        material_code: query.materialCode,
        page: query.page ?? 1,
        rows: query.rows ?? 100
      }))
    )
}

export const cutterBorrowApi = {
  getBorrowRecords: (query: CutterBorrowQuery) =>
    http.post<{ rows?: CutterBorrowRecordRaw[]; data?: CutterBorrowRecordRaw[]; total?: number; totoal?: number }>(
      '/plat/cutterApi/searchAllBorrowTime',
      null,
      {
        params: cleanParams(withToken({
          page: query.page ?? 1,
          rows: query.rows ?? 100,
          star_str: query.startTime,
          end_str: query.endTime
        }))
      }
    ),

  getReturnRecords: (query: CutterBorrowQuery) =>
    http.post<{ rows?: CutterBorrowRecordRaw[]; data?: CutterBorrowRecordRaw[]; total?: number; totoal?: number }>(
      '/plat/cutterApi/searchByReturnTime',
      null,
      {
        params: cleanParams(withToken({
          page: query.page ?? 1,
          rows: query.rows ?? 100,
          star_str: query.startTime,
          end_str: query.endTime
        }))
      }
    )
}

export const cutterViolationApi = {
  getViolationRecords: (query: CutterViolationQuery) =>
    http.get<{ rows?: CutterBorrowRecordRaw[]; data?: CutterBorrowRecordRaw[]; total?: number; totoal?: number }>(
      '/plat/cutterApi/searchDealPage',
      cleanParams(withToken({
        page: query.page ?? 1,
        rows: query.rows ?? 100,
        star_str: query.startTime,
        end_str: query.endTime,
        search_type: query.searchType ?? 'is_confirm',
        manager_comfirm: query.managerComfirm ?? '违规'
      }))
    )
}

export const cutterStockApi = {
  getStockChanges: (query: CutterStockChangeQuery) =>
    http.get<{ rows?: CutterStockChangeRaw[]; data?: CutterStockChangeRaw[]; total?: number; totoal?: number }>(
      '/plat/cutterApi/trackStock',
      cleanParams(withToken({
        star: query.startTime,
        finish: query.endTime,
        page: query.page ?? 1,
        rows: query.rows ?? 100
      }))
    )
}

export const cutterApi = {
  cabinet: cutterCabinetApi,
  material: cutterMaterialApi,
  borrow: cutterBorrowApi,
  violation: cutterViolationApi,
  stock: cutterStockApi,

  async getAllCargoInventories() {
    const cabinetsResponse = await cutterCabinetApi.getCabinets()
    const cabinets = Array.isArray(cabinetsResponse.data)
      ? cabinetsResponse.data
      : ((cabinetsResponse.data as any)?.rows || (cabinetsResponse.data as any)?.data || [])

    const cabinetRequests = cabinets
      .map((cabinet: CutterCabinetRaw) => ({
        cuttingNo: cabinet.cutting_no || cabinet.cuttingNo,
        cuttingName: cabinet.cutting_name || cabinet.cuttingName
      }))
      .filter(cabinet => cabinet.cuttingNo)

    const responses = await Promise.all(
      cabinetRequests.map(cabinet => cutterCabinetApi.getCargoInventory({ cuttingNo: cabinet.cuttingNo }))
    )

    return {
      ...cabinetsResponse,
      data: responses.flatMap((response, index) => {
        const cabinet = cabinetRequests[index]
        const data: any = response.data
        const rows = Array.isArray(data) ? data : data?.rows || data?.data || []
        return rows.map((row: CutterCargoSlotRaw) => ({
          ...row,
          cutting_no: row.cutting_no ?? row.cuttingNo ?? cabinet.cuttingNo,
          cutting_name: row.cutting_name ?? row.cuttingName ?? cabinet.cuttingName
        }))
      })
    } as ApiResponse<CutterCargoSlotRaw[]>
  },

  async getAllItemWarnings() {
    const cabinetsResponse = await cutterCabinetApi.getCabinets()
    const cabinets = Array.isArray(cabinetsResponse.data)
      ? cabinetsResponse.data
      : ((cabinetsResponse.data as any)?.rows || (cabinetsResponse.data as any)?.data || [])

    const responses = await Promise.all(
      cabinets
        .map((cabinet: CutterCabinetRaw) => cabinet.cutting_no || cabinet.cuttingNo)
        .filter(Boolean)
        .map((cuttingNo: string) => cutterCabinetApi.getItemWarnings(cuttingNo))
    )

    return {
      ...cabinetsResponse,
      data: responses.flatMap(response => {
        const data: any = response.data
        if (Array.isArray(data)) return data
        return data?.rows || data?.data || []
      })
    } as ApiResponse<CutterItemWarningRaw[]>
  }
}

export default cutterApi
