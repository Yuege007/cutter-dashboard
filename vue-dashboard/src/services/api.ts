import http from './http'
import type {
  ApiResponse,
  PaginatedResponse,
  Material,
  Cabinet,
  CabinetSlot,
  PickupRecord,
  User,
  Project
} from '@/types'

// 登录相关
export const authApi = {
  // 手机号密码登录
  login: (mobile: string, password: string, tokenCode: string) =>
    http.post<{
      serverUrl: string
      token: string
      user: any
    }>('/cutter/toolCabinetApi/checkPassWordLogin', null, {
      params: { mobile, passWord: password, token_code: tokenCode }
    })
}

// 物料相关
export const materialApi = {
  // 查询物料信息
  getMaterials: (page: number = 1, rows: number = 10, filters?: Partial<Material>) =>
    http.post<PaginatedResponse<Material>>('/cutter/toolCabinetApi/materialGrid', filters, {
      params: { page: page.toString(), rows: rows.toString() }
    }),

  // 查询预警物料
  getWarnMaterials: (page: number = 1, rows: number = 10) =>
    http.post<PaginatedResponse<Material>>('/cutter/toolCabinetApi/findInventoryAlarmMaterial', null, {
      params: { page: page.toString(), rows: rows.toString() }
    }),

  // 新增物料
  addMaterial: (material: Partial<Material>) =>
    http.post<null>('/cutter/toolCabinetApi/insertMaterial', material),

  // 物料库存出入库
  updateInventory: (data: {
    productName: string
    specification: string
    brandName: string
    cutterType: string
    number: number
    cuttingNo: string
    materialCode?: string
  }) =>
    http.post<null>('/cutter/toolCabinetApi/inOrOutStorage', data)
}

// 工具柜相关
export const cabinetApi = {
  // 查询工具柜列表
  getCabinets: (page: number = 1, rows: number = 10) =>
    http.post<PaginatedResponse<Cabinet>>('/cutter/toolCabinetApi/cabinetListapi', null, {
      params: { page: page.toString(), rows: rows.toString() }
    }),

  // 查询工具柜简单列表
  getCabinetList: (page: number = 1, rows: number = 10) =>
    http.post<PaginatedResponse<{
      id: number
      cuttingNo: string
      cuttingName: string
      cuttingAlias: string
    }>>('/cutter/toolCabinetApi/searchToolCabinetList', null, {
      params: { page: page.toString(), rows: rows.toString() }
    }),

  // 查询单个柜子的货道详情
  getCabinetSlots: (cuttingNo: string) =>
    http.post<CabinetSlot[] | { itemList: CabinetSlot[] }>('/cutter/toolCabinetApi/searchItemList', {
      cuttingNo
    }),

  // 货道库存入库（按物料信息）
  updateSlotInventoryByMaterial: (data: {
    productName: string
    specification: string
    brandName: string
    cutterType: string
    number: number
    cuttingNo: string
  }) =>
    http.post<null>('/cutter/toolCabinetApi/updateAisleInventoryByMaterial', data),

  // 货道库存入库（按货道别名）
  updateSlotInventoryByChannel: (data: {
    aisle: string
    number: number
    cuttingNo: string
  }) =>
    http.post<null>('/cutter/toolCabinetApi/updateAisleInventoryByChannel', data),

  // 货道绑定
  bindSlot: (data: {
    Id: number
    bindNum: number
    inventory?: number
    surplus?: number
    brandName: string
    materialCode?: string
    specification: string
    consumableType: string
  }) =>
    http.post<null>('/cutter/toolCabinetApi/CargoPathBindingApi', data)
}

// 领用记录相关
export const pickupApi = {
  // 根据领用时间获取领用记录
  getPickupsByBorrowTime: (
    startTime: string,
    endTime: string,
    page: number = 1,
    rows: number = 10
  ) =>
    http.post<PaginatedResponse<PickupRecord>>('/cutter/toolCabinetApi/searchByBorrowTime', null, {
      params: {
        star_str: startTime,  // 修正参数名：star_str 不是 start_str
        end_str: endTime,
        page: page.toString(),
        rows: rows.toString()
      }
    }),

  // 根据归还时间获取领用记录
  getPickupsByReturnTime: (
    startTime: string,
    endTime: string,
    page: number = 1,
    rows: number = 10
  ) =>
    http.post<PaginatedResponse<PickupRecord>>('/cutter/toolCabinetApi/searchByReturnTime', null, {
      params: {
        star_str: startTime,  // 修正参数名：star_str 不是 start_str
        end_str: endTime,
        page: page.toString(),
        rows: rows.toString()
      }
    })
}

// 用户相关
export const userApi = {
  // 查询用户信息
  getUsers: (page: number = 1, rows: number = 50) =>
    http.post<PaginatedResponse<User>>('/cutter/toolCabinetApi/searchUserList', null, {
      params: { page: page.toString(), rows: rows.toString() }
    }),

  // 添加用户
  addUser: (user: {
    name: string
    mobileNo: string
    passwd: string
    ic_no?: string
    workeNo?: string
    user_factory?: string
    userDepartment?: string
  }) =>
    http.post<null>('/cutter/toolCabinetApi/apiAddUser', user),

  // 修改用户
  updateUser: (user: {
    mobileNo: string
    name?: string
    passwd?: string
    userState: number
  }) =>
    http.post<null>('/cutter/toolCabinetApi/apiUpdateUser', user)
}

// 项目相关
export const projectApi = {
  // 查询项目管理
  getProjects: (
    page: number = 1,
    rows: number = 10,
    filters?: {
      projectName?: string
      projectState: number // 0: 所有, 1: 启用, 2: 失效
    }
  ) =>
    http.post<PaginatedResponse<Project>>('/cutter/toolCabinetApi/findProjectManagementList', filters, {
      params: { page: page.toString(), rows: rows.toString() }
    }),

  // 新增项目
  addProject: (project: {
    projectName: string
    projectNo: string
    projectState: string // "1": 启用, "2": 失效
  }) =>
    http.post<Project>('/cutter/toolCabinetApi/insertProjectAPI', project),

  // 编辑项目
  updateProject: (project: {
    Id: number
    projectName: string
    projectNo: string
    projectState: string
    company: string
  }) =>
    http.post<null>('/cutter/toolCabinetApi/updateProjectOneAPI', project)
}

// 领料单相关
export const pickingListApi = {
  // 新增领料单
  addPickingList: (data: {
    materialReqNo: string
    materials?: string // JSON字符串格式
  }) =>
    http.post<number>('/cutter/toolCabinetApi/addPickingList', data)
}

// 导出所有 API
export const api = {
  auth: authApi,
  material: materialApi,
  cabinet: cabinetApi,
  pickup: pickupApi,
  user: userApi,
  project: projectApi,
  pickingList: pickingListApi
}

export default api
