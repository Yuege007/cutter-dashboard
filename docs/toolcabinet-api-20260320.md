# 刀具柜 API 接口文档（20260320 整理版）

- 来源文件：`刀具柜API文档20260320.pdf`
- PDF 页数：112
- 识别接口数：60
- 整理时间：2026-05-20 10:10:35
- 说明：本文档由 PDF 文本抽取后整理为 Markdown。表格字段以原 PDF 为准；若出现换行截断、字段拼写差异，请以接口实测为最终依据。

## 接入约定

- 基础路径：PDF 中以 `http://xxx/plat` 或 `https://xxx/plat` 表示，实际开发时应替换为部署环境地址。
- 认证方式：除验证码/登录类接口外，多数接口需要传 `token`。PDF 中大多把 `token` 放在查询参数或请求体字段中。
- 返回约定：多数接口以 `code = OK` 表示成功，失败时 `code` 为其他值并配合 `message`。
- 字段风格：PDF 原始字段多为下划线命名，如 `product_name`、`brand_name`、`material_code`；前端建议通过适配层统一转换为驼峰命名。

## 看板开发优先接口

| 序号 | 接口用途 | 接口名称 | 方法 | 备注 |
| --- | --- | --- | --- | --- |
| 4 | 交易记录 | `cutterApi/checkDeal` | GET |  |
| 5 | 根据状态获取刀具情况 | `cutterApi/searchDealPage` | GET |  |
| 6 | 时间段领刀金额数量数据 | `cutterApi/getMoneys` | GET |  |
| 7 | 分类别和时间段领刀情况 | `cutterApi/wechatPieChart` | GET |  |
| 8 | 违规操作记录接口 | `cutterApi/searchDealPage` | GET | 违规记录/排行卡片 |
| 9 | 违规操作排名接口 | `cutterApi/wechatPieChart` | GET | 违规记录/排行卡片 |
| 10 | 根据借出时间查询借刀记录 | `cutterApi/searchByBorrowTime` | POST | 领用/归还/排行卡片 |
| 11 | 根据借出时间查询所有借刀记录 | `cutterApi/searchAllBorrowTime` | POST | 领用/归还/排行卡片 |
| 12 | 根据归还时间获取借刀记录 | `cutterApi/searchByReturnTime` | POST | 领用/归还/排行卡片 |
| 14 | 查询当前公司下所有柜子编号和名称 | `cutterApi/searchCabinetInfo` | GET | 柜体、车间、设备维度 |
| 19 | 查询公司下所有员工信息 | `cutterApi/queryUserInfo` | POST |  |
| 20 | 查询公司下工单信息 | `cutterApi/orderInfo` | GET |  |
| 21 | 查询达到库存预警的货道别名 | `cutterApi/searchItemWarn` | GET | 库存/货道预警卡片 |
| 27 | 查询货道库存信息 | `cutterApi/cargoInventory` | GET | 库存总览、柜体货道卡片 |
| 28 | 查询耗材信息 | `cutterApi/consumablesInventory` | GET | 库存总览、柜体货道卡片 |
| 29 | 查询补货单 | `cutterApi/queryReplenish` | GET | 补货单状态卡片 |
| 40 | 耗材库存预警信息 | `cutterApi/consumableInventoryEarlyWarning` | GET | 库存/货道预警卡片 |
| 48 | 按时间查询所有刀柜货道库存变更记录 | `cutterApi/trackStock` | GET | 出入库趋势、库存变更趋势 |
| 49 | 按时间查询所有操作日志 | `cutterApi/operationLog` | GET | 操作日志卡片 |
| 50 | 查询公司下的车间（新版本） | `cutterApi/queryWorkshopV2` | GET | 柜体、车间、设备维度 |
| 51 | 查询公司下的车间及设备信息（新版本） | `cutterApi/queryWorkshopAndDeviceV2` | GET | 柜体、车间、设备维度 |
| 53 | 查询工序列表 | `cutterApi/program` | GET | 工序/工单扩展卡片 |
| 54 | 查询工序详情 | `cutterApi/program` | GET | 工序/工单扩展卡片 |
| 60 | 新增盘点记录 | `plat/cutterApi/inventoryRecord` | POST | 盘点记录写入 |

## 接口总览

| 序号 | 名称 | 接口名称 | 请求方式 | URL |
| --- | --- | --- | --- | --- |
| 1 | 获取验证码 | `cutterApi/sendVerificationCode` | GET | `http://xxx/plat/cutterApi/sendVerificationCode?mobile_no=` |
| 2 | 登录验证 | `cutterApi/checkLogin` | GET | `http://xxx/plat/cutterApi/checkLogin?mobile=&code=&token_code=` |
| 3 | 手机号密码登录 | `cutterApi/checkPassWordLogin` | POST | `http://xxx/plat/cutterApi/checkPassWordLogin?mobile=&passWord=&token_code=` |
| 4 | 交易记录 | `cutterApi/checkDeal` | GET | `https://xxx/plat/cutterApi/checkDeal?token=` |
| 5 | 根据状态获取刀具情况 | `cutterApi/searchDealPage` | GET | `https://xxx/plat/cutterApi/searchDealPage?page=&rows=&star_str=&end_str=&search_type=&m...` |
| 6 | 时间段领刀金额数量数据 | `cutterApi/getMoneys` | GET | `https://xxx/plat/cutterApi/getMoneys?token=&star_str=&end_str=` |
| 7 | 分类别和时间段领刀情况 | `cutterApi/wechatPieChart` | GET | `https://xxx/plat/cutterApi/wechatPieChart?token=&star_str=&end_str=&check_type=` |
| 8 | 违规操作记录接口 | `cutterApi/searchDealPage` | GET | `https://xxx/plat/cutterApi/searchDealPage?page=&rows=&star_str=&end_str=&search_type=&m...` |
| 9 | 违规操作排名接口 | `cutterApi/wechatPieChart` | GET | `https://xxx/plat/cutterApi/wechatPieChart?token=&star_str=&end_str=&check_type=` |
| 10 | 根据借出时间查询借刀记录 | `cutterApi/searchByBorrowTime` | POST | `https://xxx/plat/cutterApi/searchByBorrowTime` |
| 11 | 根据借出时间查询所有借刀记录 | `cutterApi/searchAllBorrowTime` | POST | `https://xxx/plat/cutterApi/searchAllBorrowTime` |
| 12 | 根据归还时间获取借刀记录 | `cutterApi/searchByReturnTime` | POST | `https://xxx/plat/cutterApi/searchByReturnTime` |
| 13 | 根据管理员收刀时间获取借刀记录 | `cutterApi/searchByConfirmTime` | POST | `https://xxx/plat/cutterApi/searchByConfirmTime` |
| 14 | 查询当前公司下所有柜子编号和名称 | `cutterApi/searchCabinetInfo` | GET | `https://xxx/plat/cutterApi/searchCabinetInfo` |
| 15 | 耗材入库 | `cutterApi/manageConsumables` | GET | `https://xxx/plat/cutterApi/manageConsumables` |
| 16 | 货道库存入库(按刀具信息) | `cutterApi/warehousingByConsumable` | GET | `https://xxx/plat/cutterApi/warehousingByConsumable` |
| 17 | 货道库存入库(按货道别名) | `cutterApi/warehousingByChannel` | GET | `https://xxx/plat/cutterApi/warehousingByChannel` |
| 18 | 添加耗材 | `cutterApi/saveConsumable` | POST | `https://xxx/plat/cutterApi/saveConsumable` |
| 19 | 查询公司下所有员工信息 | `cutterApi/queryUserInfo` | POST | `https://xxx/plat/cutterApi/queryUserInfo` |
| 20 | 查询公司下工单信息 | `cutterApi/orderInfo` | GET | `https://xxx/plat/cutterApi/orderInfo` |
| 21 | 查询达到库存预警的货道别名 | `cutterApi/searchItemWarn` | GET | `https://xxx/plat/cutterApi/searchItemWarn` |
| 22 | 查询领料单 | `cutterApi/queryMaterialReq` | GET | `https://xxx/plat/cutterApi/queryMaterialReq` |
| 23 | 新增领料单 | `cutterApi/addMaterialReq` | POST | `https://xxx/plat/cutterApi/addMaterialReq` |
| 24 | 新增领料单详情 | `cutterApi/addMaterialReqInfo` | POST | `https://xxx/plat/cutterApi/addMaterialReqInfo` |
| 25 | 新增领料单详情(开启自动计算) | `cutterApi/addMaterialReqInfoAuto` | POST | `https://xxx/plat/cutterApi/addMaterialReqInfoAuto` |
| 26 | 作废领料单 | `cutterApi/cancelMaterialReq` | POST | `https://xxx/plat/cutterApi/cancelMaterialReq` |
| 27 | 查询货道库存信息 | `cutterApi/cargoInventory` | GET | `https://xxx/plat/cutterApi/cargoInventory` |
| 28 | 查询耗材信息 | `cutterApi/consumablesInventory` | GET | `https://xxx/plat/cutterApi/consumablesInventory` |
| 29 | 查询补货单 | `cutterApi/queryReplenish` | GET | `https://xxx/plat/cutterApi/queryReplenish` |
| 30 | 新增补货单 | `cutterApi/insertReplenish` | POST | `https://xxx/plat/cutterApi/insertReplenish` |
| 31 | 新增补货单详情 | `cutterApi/addReplenishBind` | POST | `https://xxx/plat/cutterApi/addReplenishBind` |
| 32 | 设置补货单作废状态 | `cutterApi/updateWaitReplenish` | GET | `https://xxx/plat/cutterApi/updateWaitReplenish` |
| 33 | 获取当前公司产品/工单信息 | `cutterApi/getDetailsProductOrderList` | GET | `https://xxx/plat/cutterApi/getDetailsProductOrderList` |
| 34 | 新增产品/工单信息 | `cutterApi/addProductOrderInfo` | POST | `https://xxx/plat/cutterApi/addProductOrderInfo` |
| 35 | 新增产品/工单：绑定刀具/绑定机床数据 | `cutterApi/addProductBindOrderOrBindDeviceList` | POST | `https://xxx/plat/cutterApi/addProductBindOrderOrBindDevic` |
| 36 | 删除工单绑刀信息 | `cutterApi/delBindOrderListByIds` | POST | `https://xxx/plat/cutterApi/delBindOrderListByIds` |
| 37 | 删除工单绑机床信息 | `cutterApi/delBindDeviceListByIds` | POST | `https://xxx/plat/cutterApi/delBindDeviceListByIds` |
| 38 | 删除工单信息 | `cutterApi/delProductOrderByIds` | POST | `https://xxx/plat/cutterApi/delProductOrderByIds` |
| 39 | 修改工单信息 | `cutterApi/updateProductOrderInfo` | POST | `https://xxx/plat/cutterApi/updateProductOrderInfo` |
| 40 | 耗材库存预警信息 | `cutterApi/consumableInventoryEarlyWarning` | GET | `https://xxx/plat/cutterApi/consumableInventoryEarlyWarnin` |
| 41 | 查询公司下的车间 | `cutterApi/queryWorkshop` | GET | `https://xxx/plat/cutterApi/queryWorkshop` |
| 42 | 新增员工用户 | `cutterApi/registeredUser` | POST | `https://xxx/plat/cutterApi/registeredUser` |
| 43 | 编辑用户 | `cutterApi/editUser` | POST | `https://xxx/plat/cutterApi/editUser` |
| 44 | 新增领料单&领料单详情 | `cutterApi/addMaterialReqAndInfo` | POST | `https://xxx/plat/cutterApi/addMaterialReqAndInfo` |
| 45 | 新增补货单&补货单详情 | `cutterApi/insertReplenishAndInfo` | POST | `https://xxx/plat/cutterApi/insertReplenishAndInfo` |
| 46 | 删除用户信息 | `cutterApi/deleteUserInfo` | POST | `https://xxx/plat/cutterApi/deleteUserInfo` |
| 47 | 查询公司下的车间及设备信息 | `cutterApi/queryWorkshopAndDevice` | GET | `https://xxx/plat/cutterApi/queryWorkshopAndDevice` |
| 48 | 按时间查询所有刀柜货道库存变更记录 | `cutterApi/trackStock` | GET | `https://xxx/plat/cutterApi/trackStock` |
| 49 | 按时间查询所有操作日志 | `cutterApi/operationLog` | GET | `https://xxx/plat/cutterApi/operationLog` |
| 50 | 查询公司下的车间（新版本） | `cutterApi/queryWorkshopV2` | GET | `https://xxx/plat/cutterApi/queryWorkshopV2` |
| 51 | 查询公司下的车间及设备信息（新版本） | `cutterApi/queryWorkshopAndDeviceV2` | GET | `https://xxx/plat/cutterApi/queryWorkshopAndDeviceV2` |
| 52 | 通过物料代码批量同步耗材信息 | `cutterApi/upsert` | POST | `https://xxx/plat/cutterApi/upsert` |
| 53 | 查询工序列表 | `cutterApi/program` | GET | `https://xxx/plat/cutterApi/program` |
| 54 | 查询工序详情 | `cutterApi/program` | GET | `https://xxx/plat/cutterApi/program/` |
| 55 | 新增工序刀单 | `cutterApi/program` | POST | `https://xxx/plat/cutterApi/program/cutter` |
| 56 | 删除工序 | `cutterApi/program` | DELETE | `https://xxx/plat/cutterApi/program/` |
| 57 | 删除工序刀单 | `cutterApi/program` | DELETE | `https://xxx/plat/cutterApi/program/cutter` |
| 58 | 新增工序工单 | `cutterApi/program` | POST | `https://xxx/plat/cutterApi/program/product` |
| 59 | 删除工序工单 | `cutterApi/program` | DELETE | `https://xxx/plat/cutterApi/program/product` |
| 60 | 新增盘点记录 | `plat/cutterApi/inventoryRecord` | POST | `https://xxx/plat/cutterApi/inventoryRecord` |

## 接口详情

### 1. 获取验证码

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/sendVerificationCode` |
| 完整 URL | `http://xxx/plat/cutterApi/sendVerificationCode?mobile_no=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 名称
接口名称 cutterApi/sendVerificationCode
完整 url http://xxx/plat/cutterApi/sendVerificationCode?mobile_no=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 mobile_no String Not null 手机号码

- 结果样例:
<ServiceResult>
<status>0</status>
<code>OK</code>
<message/>
<data/>
<duration>0</duration>
<errorCode/>
<success>false</success>
</ServiceResult>
Demo:
```

### 2. 登录验证

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/checkLogin` |
| 完整 URL | `http://xxx/plat/cutterApi/checkLogin?mobile=&code=&token_code=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 前置条件
获取验证码

- 名称
接口名称 cutterApi/checkLogin
完整 url http://xxx/plat/cutterApi/checkLogin?mobile=&code=&token_code=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 mobile String Not null 手机号码
2 code String Not null 验证码
3 token_code String Not null 对应授权公司 code

- 返回值：如下参数
序号 参数名称 说明
1 id Id
2 userId 用户 ID
3 userName 用户名称
4 name 姓名
5 sex 0:男 1:女
6 mobileNo 手机
7 remark 备注
8 createTime 创建时间
9 company 公司
10 logogram_company 公司名称简写
11 workshop_name 车间
12 factory_name 工厂
13 token token 验证
14 ct_url 当前公司 api 服务器地址
Demo:
```

### 3. 手机号密码登录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/checkPassWordLogin` |
| 完整 URL | `http://xxx/plat/cutterApi/checkPassWordLogin?mobile=&passWord=&token_code=` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 前置条件
无

- 名称
接口名称 cutterApi/checkPassWordLogin
完整 url http://xxx/plat/cutterApi/checkPassWordLogin?mobile=&passWord=&to
ken_code=
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 mobile String Not null 手机号码
2 passWord String Not null 密码
3 token_code String Not null 对应授权公司 code

- 返回值：如下参数
序号 参数名称 说明
1 id Id
2 userId 用户 ID
3 userName 用户名称
4 name 姓名
5 sex 0:男 1:女
6 mobileNo 手机
7 remark 备注
8 createTime 创建时间
9 company 公司
10 logogram_company 公司名称简写
11 workshop_name 车间
12 factory_name 工厂
13 token token 验证
14 ct_url 当前公司 api 服务器地址
Demo:
```

### 4. 交易记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/checkDeal` |
| 完整 URL | `https://xxx/plat/cutterApi/checkDeal?token=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 前置条件 ：登录成功
接口名称 cutterApi/checkDeal
完整 url https://xxx/plat/cutterApi/checkDeal?token=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null toke

- 返回值：如下参数
序号 参数名称 说明
1 deal_count （当前用户所在公司）当天取刀数量
2 grand_total （当前用户所在公司）当天取刀金额
Demo:
```

### 5. 根据状态获取刀具情况

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchDealPage` |
| 完整 URL | `https://xxx/plat/cutterApi/searchDealPage?page=&rows=&star_str=&end_str=&search_type=&manager_comfirm=&token=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明
根据状态（search_type）获取借刀记录，如果 manager_comfirm = “违规”&&
search_type =“is_confirm” 则是获取违规的借刀记录，时间范围不可超过 7 天

- 前置条件
登录成功

- 名称
接口名称 cutterApi/searchDealPage
完整 url https://xxx/plat/cutterApi/searchDealPage?
page=&rows=&star_str=&end_str=&search_type=&
manager_comfirm=&token=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 star_str String null 开始时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
4 end_str String null 结束时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
5 search_type String null used:使用中
send_back：已归还待确认
is_confirm:已确认
6 manager_comfirm String null 查 询违 规 记 录 manager_comfirm =
“违规”
7 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows brand_name:品牌
comfirm_time：确认时间
company:公司
coomdity_id:货道 id
cutter_type：刀具类别
cutting_name：刀柜名称
cutting_no：刀柜编号
depart_name：(群组)部门名称
department_id：部门 id
device_no:设备编号
factory_name：工厂名称
id:记录 id
img_id:图片 id
img_url:图片地址
is_confirm：确认状态
is_return:归还状态
is_return_str:归还原因
item_no：取刀货道
item_no_alias：取刀货道别名
item_no_prefix：取刀货道前缀
manager_comfirm：确认原因
manager_id:确认 id
pay_num：取刀数量
pay_time：取刀时间
price：刀具价格
product_name：刀具名称（刀具型号）
r_item_no_alias：还刀货道别名
r_item_no_prefix：还刀货道前缀
r_state：还刀状态
r_user_id：还刀人 id
r_user_name：还刀人名称
remark：备注
return_item_no：还刀货道
return_reason：还刀状态
return_reason2：还刀二级状态
return_time：还刀时间
serial_num：设备位置号
specification:刀具规格
user_id：借刀人 id
user_name：借刀人名称
workshop_name：所属车间
material_code:物料编码
rated_time:额定寿命/小时
knife_time:实际寿命/小时
rated_num:额定寿命/次
knife_num:实际寿命/次
order_no:工单编码
product_order:产品工单
product_num: 产品数量
same_id: 包装识别码
lift_mode：1.手动编码 2 自动编码
knife_old：1 新刀 2 旧刀
jjy_lift_num：采集的寿命次数
r_worke_no：还刀人工号
worke_no：取刀人工号
Demo:
```

### 6. 时间段领刀金额数量数据

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/getMoneys` |
| 完整 URL | `https://xxx/plat/cutterApi/getMoneys?token=&star_str=&end_str=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 前置条件
登录成功

- 名称
接口名称 cutterApi/getMoneys
完整 url https://xxx/plat/cutterApi/getMoneys?token=&star_str=&end_str=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null token 验证
2 star_str String Not null 开始时间（yyyy-MM-dd HH:mm:ss）
3 end_str String Not null 月 份 结 束 时 间 （ yyyy-MM-dd
HH:mm:ss）

- 返回值：如下参数
序号 参数名称 说明
1 yearMoney 年度累计金额
2 yearNum 年度数量
3 monthNum 当前时段累计数量
4 monthMoney 当前时段累计金额
Demo:
```

### 7. 分类别和时间段领刀情况

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/wechatPieChart` |
| 完整 URL | `https://xxx/plat/cutterApi/wechatPieChart?token=&star_str=&end_str=&check_type=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明
根据时间和类别获取领刀情况数据，如果 chck_type = bar 则是获取违规记录的
排名数据

- 前置条件
登录成功

- 名称
接口名称 cutterApi/wechatPieChart
完整 url https://xxx/plat/cutterApi/wechatPieChart?token=&star_str=&end_st
r=&check_type=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null token 验证
2 check_type String Not null user: 按员工统计；
brand:按品牌统计；
cutter_type ：按类别统计；
cutting_tools ：按刀具柜子统计；
cutter : 按刀具统计
bar:违规借刀数量记录排名
3 star_str String Not null 开始时间
4 end_str String Not null 结束时间

- 返回值：如下参数
序号 参数名称 说明
1 money "name": "分类名称",
"value": "金额"
Demo:
```

### 8. 违规操作记录接口

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchDealPage` |
| 完整 URL | `https://xxx/plat/cutterApi/searchDealPage?page=&rows=&star_str=&end_str=&search_type=&manager_comfirm=&token=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明
根据状态（search_type）获取借刀记录，如果 manager_comfirm = “违规”&&
search_type =“is_confirm” 则是获取违规的借刀记录，日期范围不可超过 7 天

- 前置条件
登录成功

- 名称
接口名称 cutterApi/searchDealPage
完整 url https://xxx/plat/cutterApi/searchDealPage?
page=&rows=&star_str=&end_str=&search_type=&
manager_comfirm=&token=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 star_str String null 开始时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
4 end_str String null 结束时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
5 search_type String null used:使用中
send_back：已归还待确认
is_confirm:已确认
6 manager_comfirm String null 查 询违 规 记 录 manager_comfirm =
“违规”
7 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows brand_name:品牌
comfirm_time：确认时间
company:公司
coomdity_id:货道 id
cutter_type：刀具类别
cutting_name：刀柜名称
cutting_no：刀柜编号
depart_name：（群组）部门名称
department_id：部门 id
device_no:设备编号
factory_name：工厂名称
id:记录 id
img_id:图片 id
img_url:图片地址
is_confirm：确认状态
is_return:归还状态
is_return_str:归还原因
item_no：取刀货道
item_no_alias：取刀货道别名
item_no_prefix：取刀货道前缀
manager_comfirm：确认原因
manager_id:确认 id
pay_num：取刀数量
pay_time：取刀时间
price：刀具价格
product_name：刀具名称（刀具型号）
r_item_no_alias：还刀货道别名
r_item_no_prefix：还刀货道前缀
r_state：还刀状态
r_user_id：还刀人 id
r_user_name：还刀人名称
remark：备注
return_item_no：还刀货道
return_reason：还刀状态
return_reason2：还刀二级状态
return_time：还刀时间
serial_num：设备位置号
specification:刀具规格
user_id：借刀人 id
user_name：借刀人名称
workshop_name：所属车间
rated_time:额定寿命/小时
knife_time:实际寿命/小时
rated_num:额定寿命/次
knife_num:实际寿命/次
order_no:工单编码
product_order:产品工单
product_num: 产品数量
same_id: 包装识别码
lift_mode：1.手动编码 2 自动编码
knife_old：1 新刀 2 旧刀
jjy_lift_num：采集的寿命次数
r_worke_no：还刀人工号
worke_no：取刀人工号
Demo:
```

### 9. 违规操作排名接口

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/wechatPieChart` |
| 完整 URL | `https://xxx/plat/cutterApi/wechatPieChart?token=&star_str=&end_str=&check_type=` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明
根据时间和类别获取领刀情况数据，如果 chck_type = bar 则是获取违规记录的
排名数据

- 前置条件
登录成功

- 名称
接口名称 cutterApi/wechatPieChart
完整 url https://xxx/plat/cutterApi/wechatPieChart?token=&star_str=&end_st
r=&check_type=
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null token 验证
2 check_type String Not null user: 按员工统计；
brand:按品牌统计；
cutter_type ：按类别统计；
cutting_tools ：按刀具柜子统计；
cutter : 按刀具统计
bar:违规借刀数量记录排名
3 star_str String Not null 开始时间
4 end_str String Not null 结束时间

- 返回值：如下参数
序号 参数名称 说明
1 money "name": "分类名称",
"value": "金额"
Demo:
```

### 10. 根据借出时间查询借刀记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchByBorrowTime` |
| 完整 URL | `https://xxx/plat/cutterApi/searchByBorrowTime` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明
时间范围不可超过 7 天,仅返回当前时间范围借出且未归还的记录

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/searchByBorrowTime
完整 url https://xxx/plat/cutterApi/searchByBorrowTime
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 star_str String Not null 开始时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
4 end_str String Not null 结束时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows brand_name:品牌
comfirm_time：确认时间
company:公司
coomdity_id:货道 id
cutter_type：刀具类别
cutting_name：刀柜名称
cutting_no：刀柜编号
depart_name：（群组）部门名称
department_id：部门 id
device_no:设备编号
factory_name：工厂名称
id:记录 id
img_id:图片 id
img_url:图片地址
is_confirm：确认状态
is_return:归还状态
is_return_str:归还原因
item_no：取刀货道
item_no_alias：取刀货道别名
item_no_prefix：取刀货道前缀
manager_comfirm：确认原因
manager_id:确认 id
pay_num：取刀数量
pay_time：取刀时间
price：刀具价格
product_name：刀具名称（刀具型号）
r_item_no_alias：还刀货道别名
r_item_no_prefix：还刀货道前缀
r_state：还刀状态
r_user_id：还刀人 id
r_user_name：还刀人名称
remark：备注
return_item_no：还刀货道
return_reason：还刀状态
return_reason2：还刀二级状态
return_time：还刀时间
serial_num：设备位置号
specification:刀具规格
user_id：借刀人 id
user_name：借刀人名称
workshop_name：所属车间
material_code:物料编码
rated_time:额定寿命/小时
knife_time:实际寿命/小时
rated_num:额定寿命/次
knife_num:实际寿命/次
order_no:工单编码
product_order:产品工单
product_num: 产品数量
same_id: 包装识别码
mobile_no: 借刀人手机号
knife_yard_no：刀具编码
material_req_no：领料单号
ct_no： 刀位号
program_name：程序名
project_name：项目名
lift_mode：1.手动编码 2 自动编码
knife_old：1 新刀 2 旧刀
jjy_lift_num：采集的寿命次数
work_process：工序名称
r_worke_no：还刀人工号
worke_no：取刀人工号
manager_name: 收刀人
manager_work_no：收刀人工号
Demo:
```

### 11. 根据借出时间查询所有借刀记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchAllBorrowTime` |
| 完整 URL | `https://xxx/plat/cutterApi/searchAllBorrowTime` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明
时间范围不可超过 15 天,返回当前时间范围所有的借出记录

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/searchAllBorrowTime
完整 url https://xxx/plat/cutterApi/searchAllBorrowTime
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 star_str String Not null 开始时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
4 end_str String Not null 结束时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows brand_name:品牌
comfirm_time：确认时间
company:公司
coomdity_id:货道 id
cutter_type：刀具类别
cutting_name：刀柜名称
cutting_no：刀柜编号
depart_name：（群组）部门名称
department_id：部门 id
device_no:设备编号
factory_name：工厂名称
id:记录 id
img_id:图片 id
img_url:图片地址
is_confirm：确认状态
is_return:归还状态
is_return_str:归还原因
item_no：取刀货道
item_no_alias：取刀货道别名
item_no_prefix：取刀货道前缀
manager_comfirm：确认原因
manager_id:确认 id
pay_num：取刀数量
pay_time：取刀时间
price：刀具价格
product_name：刀具名称（刀具型号）
r_item_no_alias：还刀货道别名
r_item_no_prefix：还刀货道前缀
r_state：还刀状态
r_user_id：还刀人 id
r_user_name：还刀人名称
remark：备注
return_item_no：还刀货道
return_reason：还刀状态
return_reason2：还刀二级状态
return_time：还刀时间
serial_num：设备位置号
specification:刀具规格
user_id：借刀人 id
user_name：借刀人名称
workshop_name：所属车间
material_code:物料编码
rated_time:额定寿命/小时
knife_time:实际寿命/小时
rated_num:额定寿命/次
knife_num:实际寿命/次
order_no:工单编码
product_order:产品工单
product_num: 产品数量
same_id: 包装识别码
mobile_no: 借刀人手机号
knife_yard_no：刀具编码
material_req_no：领料单号
ct_no： 刀位号
program_name：程序名
project_name：项目名
lift_mode：1.手动编码 2 自动编码
knife_old：1 新刀 2 旧刀
jjy_lift_num：采集的寿命次数
work_process：工序名称
r_worke_no：还刀人工号
worke_no：取刀人工号
manager_name: 收刀人
manager_work_no：收刀人工号
product_batch_no：产品批次号
product_batch：产品批次
Demo:
```

### 12. 根据归还时间获取借刀记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchByReturnTime` |
| 完整 URL | `https://xxx/plat/cutterApi/searchByReturnTime` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：
时间范围不可超过 7 天，返回当前时间归还的记录

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/searchByReturnTime
完整 url https://xxx/plat/cutterApi/searchByReturnTime
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 star_str String Not null 开始时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
4 end_str String Not null 结束时间 yyyy-MM-dd HH:mm:ss 不
传时默认为今日记录
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows brand_name:品牌
comfirm_time：确认时间
company:公司
coomdity_id:货道 id
cutter_type：刀具类别
cutting_name：刀柜名称
cutting_no：刀柜编号
depart_name：（群组）部门名称
department_id：部门 id
device_no:设备编号
factory_name：工厂名称
id:记录 id
img_id:图片 id
img_url:图片地址
is_confirm：确认状态
is_return:归还状态
is_return_str:归还原因
item_no：取刀货道
item_no_alias：取刀货道别名
item_no_prefix：取刀货道前缀
manager_comfirm：确认原因
manager_id:确认 id
pay_num：取刀数量
pay_time：取刀时间
price：刀具价格
product_name：刀具名称（刀具型号）
r_item_no_alias：还刀货道别名
r_item_no_prefix：还刀货道前缀
r_state：还刀状态
r_user_id：还刀人 id
r_user_name：还刀人名称
remark：备注
return_item_no：还刀货道
return_reason：还刀状态
return_reason2：还刀二级状态
return_time：还刀时间
serial_num：设备位置号
specification:刀具规格
user_id：借刀人 id
user_name：借刀人名称
workshop_name：所属车间
material_code:物料编码
rated_time:额定寿命/小时
knife_time:实际寿命/小时
rated_num:额定寿命/次
knife_num:实际寿命/次
order_no:工单编码
product_order:产品工单
product_num: 产品数量
same_id: 包装识别码
mobile_no: 借刀人手机号
knife_yard_no：刀具编码
material_req_no：领料单号
ct_no： 刀位号
program_name：程序名
project_name：项目名
lift_mode：1.手动编码 2 自动编码
knife_old：1 新刀 2 旧刀
jjy_lift_num：采集的寿命次数
work_process：工序名称
r_worke_no：还刀人工号
worke_no：取刀人工号
manager_name: 收刀人
manager_work_no：收刀人工号
product_batch_no：产品批次号
product_batch：产品批次
Demo:
```

### 13. 根据管理员收刀时间获取借刀记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchByConfirmTime` |
| 完整 URL | `https://xxx/plat/cutterApi/searchByConfirmTime` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：
时间范围不可超过 15 天，返回当前时间管理员收刀的记录

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/searchByConfirmTime
完整 url https://xxx/plat/cutterApi/searchByConfirmTime
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 star_str String Not null 开始时间 yyyy-MM-dd HH:mm:ss 不
传时默认为当天记录
4 end_str String Not null 结束时间 yyyy-MM-dd HH:mm:ss 不
传时默认为当天记录
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows brand_name:品牌
comfirm_time：确认时间
company:公司
coomdity_id:货道 id
cutter_type：刀具类别
cutting_name：刀柜名称
cutting_no：刀柜编号
depart_name：（群组）部门名称
department_id：部门 id
device_no:设备编号
factory_name：工厂名称
id:记录 id
img_id:图片 id
img_url:图片地址
is_confirm：确认状态
is_return:归还状态
is_return_str:归还原因
item_no：取刀货道
item_no_alias：取刀货道别名
item_no_prefix：取刀货道前缀
manager_comfirm：确认原因
manager_id:确认 id
pay_num：取刀数量
pay_time：取刀时间
price：刀具价格
product_name：刀具名称（刀具型号）
r_item_no_alias：还刀货道别名
r_item_no_prefix：还刀货道前缀
r_state：还刀状态
r_user_id：还刀人 id
r_user_name：还刀人名称
remark：备注
return_item_no：还刀货道
return_reason：还刀状态
return_reason2：还刀二级状态
return_time：还刀时间
serial_num：设备位置号
specification:刀具规格
user_id：借刀人 id
user_name：借刀人名称
workshop_name：所属车间
material_code:物料编码
rated_time:额定寿命/小时
knife_time:实际寿命/小时
rated_num:额定寿命/次
knife_num:实际寿命/次
order_no:工单编码
product_order:产品工单
product_num: 产品数量
same_id: 包装识别码
mobile_no: 借刀人手机号
knife_yard_no：刀具编码
material_req_no：领料单号
ct_no： 刀位号
program_name：程序名
project_name：项目名
lift_mode：1.手动编码 2 自动编码
knife_old：1 新刀 2 旧刀
jjy_lift_num：采集的寿命次数
work_process：工序名称
r_worke_no：还刀人工号
worke_no：取刀人工号
manager_name: 收刀人
manager_work_no：收刀人工号
product_batch_no：产品批次号
product_batch：产品批次
Demo:
```

### 14. 查询当前公司下所有柜子编号和名称

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchCabinetInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/searchCabinetInfo` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：
当前获取到的柜子编号将用于货道库存入库

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/searchCabinetInfo
完整 url https://xxx/plat/cutterApi/searchCabinetInfo
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 cutting_no 刀具柜编号
2 cutting_name 刀具柜名称
Demo:
```

### 15. 耗材入库

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/manageConsumables` |
| 完整 URL | `https://xxx/plat/cutterApi/manageConsumables` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：
可以通过型号、规格、品牌名称入库，也可以直接通过物料代码入库，当前接口
仅影响耗材总库存，不影响货道库存

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/manageConsumables
完整 url https://xxx/plat/cutterApi/manageConsumables
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 product_name String Not null 型号
3 specification String Not null 规格
4 brand_name String Not null 品牌名称
5 number Int Not null 入库数量（正数入库、负数出库）
6 price Double null 入库价格
7 cuttingNo String Not null 入库柜子编号
8 materialCode String Null 物料代码

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 16. 货道库存入库(按刀具信息)

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/warehousingByConsumable` |
| 完整 URL | `https://xxx/plat/cutterApi/warehousingByConsumable` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：
当前接口只能入库货道库存不支持出库， 支持通过刀具型号、规格、品牌名称
或物料编码入库，且当前耗材在当前柜子有且只有只有一个货道，如果存放在多个货道将入
库失败，在开启“货道库存同步刀具总库存”时会同时入库耗材总库存，入库数量不包含包
装数量，耗材总库存入库数量 = 数量 * 货道包装数量，

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/warehousingByConsumable
完整 url https://xxx/plat/cutterApi/warehousingByConsumable
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 product_name String Not null 型号
3 specification String Not null 规格
4 brand_name String Not null 品牌名称
5 number Int Not null 入库数量
6 cutting_no String Not null 入库柜子编号
7 material_code String Null 物料代码

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 17. 货道库存入库(按货道别名)

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/warehousingByChannel` |
| 完整 URL | `https://xxx/plat/cutterApi/warehousingByChannel` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：
当前接口只能入库货道库存不支持出库， 在开启“货道库存同步刀具总库存”
时会同时入库耗材总库存，入库数量不能超过货道容量，当前不包含包装数量，耗材总库存
入库数量 = 数量 * 货道包装数量

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/warehousingByChannel
完整 url https://xxx/plat/cutterApi/warehousingByChannel
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 channel_no String Not null 货道编号 如：A001
3 number Int Not null 入库数量
4 cutting_no String Not null 入库柜子编号

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 18. 添加耗材

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/saveConsumable` |
| 完整 URL | `https://xxx/plat/cutterApi/saveConsumable` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：
当前接口只能新增耗材，不支持入库，新增后库存为 0 ， 如需入库请调用入库
接口

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/saveConsumable
完整 url https://xxx/plat/cutterApi/saveConsumable
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 brand_name String Not null 品牌名称
3 product_name String Not null 型号
4 specification String Not null 规格
5 cutter_type String Not null 刀具类别
6 material_code String 物料编码
7 price double 价格
8 rated_time Double null 额定寿命/小时
9 rated_num Double null 额定寿命/次

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 19. 查询公司下所有员工信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryUserInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/queryUserInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 可通过员工姓名、手机号、工号、ic 卡号查询对应的员工信息

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryUserInfo
完整 url https://xxx/plat/cutterApi/queryUserInfo
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 name String null 姓名
2 mobileNo String null 手机号
3 workeNo String null 工卡号
4 icNo String null ic 卡号
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 rows name: 姓名
mobile_no: 手机号
worke_no": 工卡号
ic_no": ic 卡号
Demo:
```

### 20. 查询公司下工单信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/orderInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/orderInfo` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 可通过工单名称、工单编号查询对应的工单信息,不支持模糊查询

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/orderInfo
完整 url https://xxx/plat/cutterApi/orderInfo
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 page String Not null 页数
2 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）
3 product_order String null 产品名称/工单
4 order_no String null 工单编码
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 rows product_order: 产品名称/工单,
product_num: 产品数量
order_no: 工单编码
Demo:
```

### 21. 查询达到库存预警的货道别名

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/searchItemWarn` |
| 完整 URL | `https://xxx/plat/cutterApi/searchItemWarn` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 通过刀具柜编号获取当前柜下所有库存达到预警值得货道别名

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/searchItemWarn
完整 url https://xxx/plat/cutterApi/searchItemWarn
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 cuttingNo String Not null 刀具柜编号
2 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 surplus 货道实时库存
2 inventory 货道容量
3 itemNoAlias 货道别名
4 materialCode 物料代码
5 warnValue 预警值
6 productName 型号
7 brandName 品牌
8 specification 规格
9 cutterType 类别
10 bindNum 包装数量
Demo:
```

### 22. 查询领料单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryMaterialReq` |
| 完整 URL | `https://xxx/plat/cutterApi/queryMaterialReq` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 可通过领料单号(支持模糊查询)和领料单的状态查询领料单及单号下的详情数
据，有分页

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryMaterialReq
完整 url https://xxx/plat/cutterApi/queryMaterialReq
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 req_state int null 领刀状态:1 待领用，2 已领用，4 作
废。默认不传或者 0 查全部
2 material_req_no String null 领料单号(模糊查询)
3 page Int null 获取当前页，默认为 1
4 rows Int null 获取行数，默认 15
5 token String Not null 认证 token
6 startTime String null 开始时间 (创建领料单时间范围
格 式 :2023-03-24 15:57 或 者
2023-03-24)
7 endTime String null 结束时间

- 返回值：如下参数
序号 参数名称 说明
1 totoal 总数据数
2 pageCount 总页数
3 numPerPage 页码大小
4 currentPage 当前页
5 pageNum 总页码
6 data( 未 开 启 自 动 计
算)
"create_by" : 创建人,
"id" : id,
"create_time": 创建时间,
"material_req_no": 领料单号,
"user_name": 领料人姓名,
"worke_no": 领料人工号,
"req_time": 领用时间,
"req_state": 领用状态(1 待领用，2 已领用，4
废除),
"cutting_no": 刀柜编号,
"apiInfoVOList" : [{
"brand_name": 品牌,
"product_name": 刀具名称(刀具型号),
"specification": 规格,
"cutter_type": 类别,
"material_code": 物料代码,
"package_total": 包装数,
"item_no_alias": 货道号,
"device_no": 设备号,
"serial_num": 设备位置号,
"product_order": 产品/工单,
"req_total": 总数,
"req_state": 领用状态(1 待领用，2 已领用，
4 废除)
} , ......]
如需得出盒 = req_total / package_total 总
数/包装数
7 data(开启自动计算) "create_by" : 创建人,
"id" : id,
"create_time": 创建时间,
"material_req_no": 领料单号,
"user_name": 领料人姓名,
"worke_no": 领料人工号,
"req_time": 领用时间,
"req_state": 领用状态(1 待领用，2 已领用，4
废除),
"cutting_no": 刀柜编号,
"apiInfoVOList" : [{
"brand_name": 品牌,
"product_name": 刀具名称(刀具型号),
"specification": 规格,
"cutter_type": 类别,
"material_code": 物料代码,
"device_no": 设备号,
"serial_num": 设备位置号,
"product_order": 产品/工单,
"req_total": 总数,
"boxNum": 盒数,
"req_state": 领用状态((1 待领用，2 已领
用，4 废除)
} , ......]
8 data(跨柜取刀) "create_by" : 创建人,
"id" : id,
"create_time": 创建时间,
"material_req_no": 领料单号,
"user_name": 领料人姓名,
"worke_no": 领料人工号,
"req_time": 领用时间,
"req_state": 领用状态(1 待领用，2 已领用，4
废除),
"apiInfoVOList" : [{
"brand_name": 品牌,
"product_name": 刀具名称(刀具型号),
"specification": 规格,
"cutter_type": 类别,
"material_code": 物料代码,
"device_no": 设备号,
"serial_num": 设备位置号,
"product_order": 产品/工单,
"req_total": 总数,
"req_state": 领用状态((1 待领用，2 已领
用，4 废除),
"take_knife_count":已领数
} , ......]
Demo:
```

### 23. 新增领料单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addMaterialReq` |
| 完整 URL | `https://xxx/plat/cutterApi/addMaterialReq` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 创建领料单信息需要传参：领料单号，传入领料人手机号或者领料人工号(必须
要其中一个参数)，刀柜编码

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/addMaterialReq
完整 url https://xxx/plat/cutterApi/addMaterialReq
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 mobile_no String Not null 领料人员手机号
2 material_req_no String Not null 领料单号
3 cutting_no String Not null 刀柜编号
4 token String Not null 认证 token
5 worke_no String Null 领料人员工号(备注：领料人员工号
和领料人员手机号必须要其中一个)

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 24. 新增领料单详情

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addMaterialReqInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/addMaterialReqInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：创建领料单号下需要领取的刀具的信息，根据货道别名取出货道里面的刀具，可
批量添加

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/addMaterialReqInfo
完整 url https://xxx/plat/cutterApi/addMaterialReqInfo
请求方式 Post

- 入参：需要如下参数
序
号
参数名称 说明
1 {
"material_req_no":"asdf123",
"apiAddInfoList":[{
"item_no_alias":"A020",
"req_total":8,
"product_order":"产品/工单",
"serial_num":"机床",
"factory_id": 1
}]
}
2 token String Not
null
认证 token
3 material_req_no String Not
null
领料单号
4 item_no_alias String Not
null
货道别名
5 req_total Integer Not
null
领料总数
6 serial_num String null 设备位置号 ,如果位置号不为空并
且存登录用户在多个车间那么工 id
必须传入。
7 factory_id Long Null 工厂 id
8 product_order String null 产品/工单
9 apiAddInfoList List<Object> Not
null

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 25. 新增领料单详情(开启自动计算)

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addMaterialReqInfoAuto` |
| 完整 URL | `https://xxx/plat/cutterApi/addMaterialReqInfoAuto` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：根据领料单号批量添加领料刀具信息。

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/addMaterialReqInfoAuto
完整 url https://xxx/plat/cutterApi/addMaterialReqInfoAuto
请求方式 Post

- 入参：需要如下参数
序
号
参数名称 说明
1 {
"material_req_no":"领料单号",
"apiInfoVOList":[{
"material_code":"物料代码",
"req_total":8,
"brand_name":"刀具品牌",
"specification":"规格",
"product_name":"型号",
"serial_num":"机床",
"product_order":"产品/工单",
"factory_id": 1
}]
}
2 token String Not
null
认证 token
3 material_req_
no
String Not
null
领料单号
4 apiInfoVOList List<Object> Not
null
5 material_code String Not
null
物料编码(如果为空下面三个字段必须有值)
6 brand_name String null 品牌
7 product_name String null 产品名称
8 specification String null 规格
9 req_total Integer not
null
领料总数
10 serial_num String null 设备位置号 ,如果位置号不为空并
且存登录用户在多个车间那么工 id
必须传入。
11 factory_id Long Null 工厂 id
12 product_order String null 产品/工单

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 26. 作废领料单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/cancelMaterialReq` |
| 完整 URL | `https://xxx/plat/cutterApi/cancelMaterialReq` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：根据领料单号废除领料单，废除了的领料单不可使用

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/cancelMaterialReq
完整 url https://xxx/plat/cutterApi/cancelMaterialReq
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 material_req_no String Not null 领料单号
2 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 27. 查询货道库存信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/cargoInventory` |
| 完整 URL | `https://xxx/plat/cutterApi/cargoInventory` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：通过柜子编号查询当前刀具柜下货道的库存信息，查部分货道可以携带上货道别
名、货道中存放的刀具相关信息等参数

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/cargoInventory
完整 url https://xxx/plat/cutterApi/cargoInventory
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 cutting_no String Not null 刀柜编号
2 channel_no String null 货道别名
3 brand_name String null 品牌
4 product_name String Null 型号
5 specification String Null 规格
6 material_code String Null 物料编码
7 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 data inventory: 货道容量,
surplus: 货道实时库存,
itme_no: 货道号,
bind_num: 包装数量,
rwarn_num: 货道库存预警值,
item_no_alias: 货道编号,
item_no_prefix: 货道前缀,
dis_item_no: 1.正常 2.货道被禁用
cutting_tools_brand_id: 货道绑定的耗材 id（0：代表空货道）
material_code: 物料编码,
brand_name: 品牌,
product_name: 型号,
specification: 规格,
cutter_type: 刀具类别
Demo:
```

### 28. 查询耗材信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/consumablesInventory` |
| 完整 URL | `https://xxx/plat/cutterApi/consumablesInventory` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：查询当前公司下耗材信息

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/consumablesInventory
完整 url https://xxx/plat/cutterApi/consumablesInventory
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 brand_name String null 品牌
2 product_name String Null 型号
3 specification String Null 规格
4 material_code String Null 物料编码
5 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 data brand_name: 品牌,
product_name: 型号,
specification: 规格,
inventory: 库存,
material_code: 物料编码
cutter_type：刀具类别
imgUrls：图片 url
price: 单价
inventory_warn：库存预警值
Demo:
```

### 29. 查询补货单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryReplenish` |
| 完整 URL | `https://xxx/plat/cutterApi/queryReplenish` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 可通过补货单号(支持模糊查询)和补货单的状态查询补货单及单号下的详情数
据，有分页

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryReplenish
完整 url https://xxx/plat/cutterApi/queryReplenish
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 wait_replenish int null 补货状态:1 已补货，2 待补货，4.作
废，默认不传或者 0 查全部
2 replenish_no String null 补货单号(模糊查询)
3 page Int null 获取当前页，默认为 1
4 rows Int null 获取行数，默认 15
5 token String Not null 认证 token
6 startTime String null 开始时间 (创建补货单时间范围
格 式 :2023-03-24 15:57 或 者
2023-03-24)
7 endTime String null 结束时间

- 返回值：如下参数
序号 参数名称 说明
1 totoal 总数据数
2 pageCount 总页数
3 numPerPage 页码大小
4 currentPage 当前页
5 pageNum 总页码
6 data {
"id":id,
"replenish_no":补货单号,
"create_time":创建日期,
"create_by":"创建人",
"work_no":"工号",
"replenish_time":补货时间,
"wait_replenish":补货状态,
"cutting_no":"刀具编号",
"replenish_name":"补货人员",
"cutterReplenishBindApiVoList": [
{
"id":id,
"package_total":包装数量,
"req_total":总数,
"wait_replenish":补货状态,
"item_no_alias":货道号,
"brand_name":品牌,
"product_name":型号,
"specification":规格,
"material_code":物料代码,
"cutter_type":刀具类型
}
]
}
如需得出盒 = req_total / package_total 总
数/包装数
Demo:
```

### 30. 新增补货单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/insertReplenish` |
| 完整 URL | `https://xxx/plat/cutterApi/insertReplenish` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 创建补货单信息需要传参：补货单号，补货人手机号码或者补货人员工号，刀
柜编码

- 前置条件
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/insertReplenish
完整 url https://xxx/plat/cutterApi/insertReplenish
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 mobile_no String Not null 补货人员手机号
2 replenish_no String Not null 补货单号
3 cutting_no String Not null 刀柜编号（刀柜编号和刀柜名称二选
一不为空）
4 token String Not null 认证 token
5 work_no String null 补货人员工号(备注：补货人员工号
和补货人员手机号必须要其中一个)
6 cutting_name String Not null 刀柜名称（刀柜编号和刀柜名称二选
一不为空）

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 31. 新增补货单详情

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addReplenishBind` |
| 完整 URL | `https://xxx/plat/cutterApi/addReplenishBind` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 创建补货单详情信息需要传参：补货单号，货道号(支持扩展货道 如:A001#)，
盒数
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/addReplenishBind
完整 url https://xxx/plat/cutterApi/addReplenishBind
请求方式 Post

- 入参：需要如下参数
序号 参数 格式
1 cutterReplenishEditVo {
"updateReq":{
"replenish_no":"123",
},
"addList":[{
"item_no_alias":"A001",
"box_number": "10",
"material_code"：""
}]
}
2 token String Not null 认证 token
3 updateReq Object Not null
4 replenish_no String Not null 补货单号
5 addList List<Object> Not null
6 item_no_alias String Not null 货道号(支持扩展货道 如:A001#)
7 box_number Integer Not null 盒数
8 material_code String null 物料代码(传了物料代码会根据物
料代码查询是否同该货道号绑定
的一致)

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 32. 设置补货单作废状态

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/updateWaitReplenish` |
| 完整 URL | `https://xxx/plat/cutterApi/updateWaitReplenish` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 设置补货单作废状态需要传参：补货单 id
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/updateWaitReplenish
完整 url https://xxx/plat/cutterApi/updateWaitReplenish
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 id String Not null 补货单 id

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 33. 获取当前公司产品/工单信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/getDetailsProductOrderList` |
| 完整 URL | `https://xxx/plat/cutterApi/getDetailsProductOrderList` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 获取当前公司产品/工单信息

- 需要传参：产品名称/工单 productOrder

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/getDetailsProductOrderList
完整 url https://xxx/plat/cutterApi/getDetailsProductOrderList
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 productOrder String null 产品名称/工单
2 startDate String Null 开始时间 (创建工单时间范围
格式:2023-01-24 00:00:00)
3 endDate String Null 结束时间 (创建工单时间范围
格式:2023-05-24 00:00:00)
4 page String Not null 页数
5 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）

- 返回值：如下参数
序号 参数名称 说明
1 totoal 总数据数
2 pageCount 总页数
3 numPerPage 页码大小
4 currentPage 当前页
5 pageNum 总页码
6 data "total": 1,
"pageCount": 1,
"numPerPage": 15,
"currentPage": 1,
"pageNum": 1
"rows": [
{
"id": id,
"productOrder": 工单名称,
"company": 公司,
"remake": 备注,
"modifyBy": 修改人,
"lastTime": 修改时间,
"createTime": 创建时间,
"createBy": 创建人,
"cuttingType": 所属模块：1 刀具柜 2 工具柜,
"orderState": 是否失效：1 正常 2 失效,
"order_no": 工单编码,
"product_num": 产品数量,
"factory_id": 工厂 id,
"bindOrderVos": [
{
"id": 绑定刀具表 id,
"company": 公司,
"factoryId": 工厂 id,
"createTime":创建时间,
"createBy": 创建人,
"modifyBy": 修改人,
"lastTime": 修改时间,
"cuttingToolsBrandId": 刀具表 id,
"bindNum": 数量,
"cProductOrderId": 工单表 id
}
],
"bindDeviceVos": [
{
"id": 绑定工厂表 id,
"company": 公司,
"factory_id": 工厂 id,
"createTime":创建时间,
"createBy": 创建人,
"modifyBy": 修改人,
"lastTime": 修改时间,
"device_no": 设备号,
"device_serial_num": 设备位置号,
"c_product_order_id": 工单表 id
}
]
}
]
Demo:
```

### 34. 新增产品/工单信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addProductOrderInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/addProductOrderInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 新增产品/工单信息

- 需要传参：产品工单名称，工单编码，产品数量，启用状态

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/addProductOrderInfo
完整 url https://xxx/plat/cutterApi/addProductOrderInfo
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 productOrder String Not null 产品/工单名称
3 order_no String null 工单编码
4 product_num Integer 0 产品数量
5 order_state String Not null 是否启用：1 启用或 2 失效

- 返回值：如下参数
序号 参数名称 说明
1 返回的 json 集合 {
"status": 1,
"code": "OK",
"message": "操作成功",
"data": {
"id": 90
}
}
2 code OK：成功 其他：失败
3 id 新增成功的产品/工单 ID
4 status 状态：1：成功,其他：失败
Demo:
```

### 35. 新增产品/工单：绑定刀具/绑定机床数据

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addProductBindOrderOrBindDeviceList` |
| 完整 URL | `https://xxx/plat/cutterApi/addProductBindOrderOrBindDevic` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 新增产品/工单：绑定刀具/绑定机床数据

- 需要传参：产品工单 id,产品/工单名称,公司,绑定刀具对象,刀具 id,数量,绑定机床对
象,设备号,设备位置号

- 登录成功且有操作 PC 端权限

- 第一次提交 A 工单绑定 A 刀具绑定 A 机床，后续绑定 B 刀或者 C 刀的时候请不要提交 A 机
床、A 刀具这样的话会提示重复绑定

- 名称
接口名称 cutterApi/addProductBindOrderOrBindDeviceList
完整 url https://xxx/plat/cutterApi/addProductBindOrderOrBindDevic
eList
请求方式 POST

- 入参：需要如下参数
序号 参数 格式
1 detailsAddVo {
"id": 228,
"productOrder": 工单名称,
"company": "深圳丹弗科技有限公司",
"bindOrderVos": [
{
"product_name": "钨钢铣刀Φ12*200L",
"brand_name": "伊诺",
"specification": "D12*200L*3F",
"cutter_type": "螺纹刀具",
"material_code": "DF2023080388921"
}
],
"bindDeviceVos": [
{
"device_no": "szsffw-jc-29-a",
"device_serial_num": "JC-29"
}
]
}
序号 参数名称 类型 允许为空 说明
2 token String Not null 认证 token
3 detailsAddVo Object Not null
4 id Long Not null 产品工单 id
5 productOrder String Not null 产品/工单名称
6 company String null 公司
7 bindOrderVos Object Not null 绑定刀具对象
8 product_name String Is Null 或
者 Not null
刀具型号，当物料代码为空刀具型号
不能为空，物料代码不为空刀具型号
才能为空，二选一
9 brand_name String Is Null 或
者 Not null
刀具品牌，当物料代码为空刀具品牌
不能为空，物料代码为空刀具品牌才
能为空，二选一
10 specification String Is Null 或
者 Not null
规格，当物料代码为空规格不能为
空，物料代码不为空规格才能为空，
二选一
11 cutter_type String Is Null 或
者 Not null
刀具类别，当物料代码为空刀具类别
不能为空，物料代码不为空刀具类别
才能为空，二选一
12 material_code String Is Null 或
者 Not null
物料代码，当刀具型号、刀具品牌、
规格、刀具类别为空时，物料代码不
能为空，反之刀具型号、刀具品牌、
规格、刀具类别不为空时，物料代码
才能为空，二选一
13 bindDeviceVos Object Is Null 或
者 Not null
绑定机床对象
14 device_no String Is Null 或
者 Not null
设备号（如果 bindDeviceVos 不为空
时则不能为空）
15 device_serial_num String Is Null 或
者 Not null
设备位置号（如果 bindDeviceVos 不
为空时则不能为空）

- 返回值：如下参数
序号 参数名称 说明
1 返回的 json 集合 {
"status": 1,
"code": "OK",
"message": "操作成功",
"data": {
"bindBrandIds": [
95
],
"bindDeviceIds": [
48
],
"id": 91
}
}
2 code OK：成功 其他：失败
3 id 产品/工单 ID
4 status 状态：1：成功,其他：失败
5 bindBrandIds 工单绑定刀表表 id 集合
6 bindDeviceIds 工单绑定设备表 id 集合
Demo:
```

### 36. 删除工单绑刀信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/delBindOrderListByIds` |
| 完整 URL | `https://xxx/plat/cutterApi/delBindOrderListByIds` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 删除工单绑刀信息

- 需要传参：产品工单 id，删除 id 集合

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/delBindOrderListByIds
完整 url https://xxx/plat/cutterApi/delBindOrderListByIds
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 detailsAddVo Object Not null {
"id": 218,
"delBindOrderIds": [
139,
140
]
}
3 id String Not null 工单 id
4 delBindOrderIds List<Long> Not null 需要删除的 id 集合（绑定刀具数据
id）：
"delBindOrderIds": [
139,
140
]

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 37. 删除工单绑机床信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/delBindDeviceListByIds` |
| 完整 URL | `https://xxx/plat/cutterApi/delBindDeviceListByIds` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 删除工单绑机床信息

- 需要传参：产品工单 id，删除 id 集合

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/delBindDeviceListByIds
完整 url https://xxx/plat/cutterApi/delBindDeviceListByIds
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 detailsAddVo Object Not null {
"id": 218,
"delBindDeviceIds": [
139,
140
]
}
3 id String Not null 工单 id
4 delBindDeviceIds List<Long> Not null 需要删除的 id 集合：
"delBindDeviceIds": [
139,
140
]

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 38. 删除工单信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/delProductOrderByIds` |
| 完整 URL | `https://xxx/plat/cutterApi/delProductOrderByIds` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 删除工单信息

- 需要传参：产品工单 id 集合

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/delProductOrderByIds
完整 url https://xxx/plat/cutterApi/delProductOrderByIds
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 delIds List<Long> Not null 需要删除的 id 集合：[
139,
140
]

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功
其他：请先移除工单绑定的刀具或机床，
失败
Demo:
```

### 39. 修改工单信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/updateProductOrderInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/updateProductOrderInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 修改工单信息

- 需要传参：产品工单对象：id,工单名称,工单编码,数量,启用状态

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/updateProductOrderInfo
完整 url https://xxx/plat/cutterApi/updateProductOrderInfo
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 orderVo Object Not null {
"id": 228,
"productOrder":工单名称,
"order_no": "",
"product_num": 10,
"orderState": 1
}
3 id String Not null 产品/工单 id
4 productOrder String Not null 产品/工单名称
5 order_no String null 工单编码
6 product_num String null 产品数量
7 order_state String Not null 是否启用：1 启用或 2 失效

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功
其他：失败
Demo:
```

### 40. 耗材库存预警信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/consumableInventoryEarlyWarning` |
| 完整 URL | `https://xxx/plat/cutterApi/consumableInventoryEarlyWarnin` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 耗材库存预警信息

- 需要传参：品牌名称，型号，物料代码

- 登录成功且有操作 PC 端权限

- 名称
接口名称 cutterApi/consumableInventoryEarlyWarning
完整 url https://xxx/plat/cutterApi/consumableInventoryEarlyWarnin
g
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 brand_name String null 品牌名称
3 product_name String null 型号
4 material_code String null 物料代码
5 page String Not null 页数
6 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）

- 返回值：如下参数
序号 参数名称 说明
1 totoal 总数据数
2 pageCount 总页数
3 numPerPage 页码大小
4 currentPage 当前页
5 pageNum 总页码
6 data "total": 1,
"pageCount": 1,
"numPerPage": 15,
"currentPage": 1,
"pageNum": 1
"rows": [
{
"id": 耗材 id,
"brand_name": 品牌名称,
"product_name": 型号,
"inventory": 库存,
"surplus": 剩余库存数量,
"inventory_warn": 库存预警数量,
"material_code": 物料代码
}
]
Demo:
```

### 41. 查询公司下的车间

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryWorkshop` |
| 完整 URL | `https://xxx/plat/cutterApi/queryWorkshop` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 查询登录账户的公司车间，分页展示
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryWorkshop
完整 url https://xxx/plat/cutterApi/queryWorkshop
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 page String Not null 页数
3 rows String Not null 每页行数（最大值为 50，本地部署最
大值 100）

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 code OK：成功 其他：失败
6 row id: id
company: 公司名称
factory_name: 工厂名称
workshop_name: 车间名称
alias_workshop_name: 车间别名
alias_factory_name: 工厂别名
factory_pid : 工厂 id
Demo:
```

### 42. 新增员工用户

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/registeredUser` |
| 完整 URL | `https://xxx/plat/cutterApi/registeredUser` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 创建员工用户
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/registeredUser
完整 url https://xxx/plat/cutterApi/registeredUser
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 userName String null 用户名称
3 passwd String Not null 密码
4 name String Not null 姓名
5 mobileNo String Not null 手机号码
6 mail String null 邮箱
7 address String null 详细地址
8 worke_no String null 工号
9 factoryMapCo
nfigList
List<O
bject>
null "factoryMapConfigList":[
{
factory_id : 1 // 车间 id
},......
]可传入多个车间 id
10 ic_no String Null ic 卡号

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 43. 编辑用户

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/editUser` |
| 完整 URL | `https://xxx/plat/cutterApi/editUser` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 编辑员工用户
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/editUser
完整 url https://xxx/plat/cutterApi/editUser
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 mobileNo String Not null 手机号码
3 passwd String null 密码
4 name String null 姓名
5 userName String null 用户名称
6 worke_no String null 工号
7 mail String null 邮箱
8 address String null 详细地址
9 ic_no String Null ic 卡号

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 44. 新增领料单&领料单详情

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/addMaterialReqAndInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/addMaterialReqAndInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 新增领料单并且新增领料单详情数据
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/addMaterialReqAndInfo
完整 url https://xxx/plat/cutterApi/addMaterialReqAndInfo
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
示例 {
"material_req_no":"",
"mobile_no" : "",
"cutting_no" : "",
"worke_no" : "",
"ic_no" : "",
"apiInfoVOList":[{
"item_no_alias":"",
"material_code":"",
"req_total":1,
"brand_name":"",
"specification":"",
"product_name":"",
"serial_num":"",
"product_order":"",
"factory_id": 1
}]
}
1 mobile_no String null 领料人员手机号
2 material_req_no String Not null 领料单号
3 cutting_no String null 刀柜编号(自动计算方式需要传入该值)
4 token String Not null 认证 token
5 worke_no String Null 工号
6 ic_no String Null ic 卡号(备注：领料人员工号或手机号或 ic 卡号
必须要其中一个)
7 apiInfoVOList List<Obj
ect>
Not null 详情数据集
8 material_code String Not null 物料编码(备注：如果为空下面三个字段必须有
值)
9 brand_name String null 品牌
10 product_name String null 产品名称
11 specification String null 规格
12 req_total Integer not null 领料总数
13 serial_num String null 设备位置号 ,如果位置号不为空并
且存登录用户在多个车间那么工厂 id
必须传入。
14 factory_id Long Null 工厂 id
15 product_order String null 产品/工单
16 item_no_alias String Not null 货道别名(备注:不是自动计算需要传入该值)

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 45. 新增补货单&补货单详情

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/insertReplenishAndInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/insertReplenishAndInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 新增补货单并且新增补货单详情数据(支持扩展货道 如:A001#)
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/insertReplenishAndInfo
完整 url https://xxx/plat/cutterApi/insertReplenishAndInfo
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
示例 {
"replenish_no":,
"mobile_no":,
"cutting_no":"",
"work_no":,
"cutting_name":"",
"addList":[{
"item_no_alias":"",
"box_number": "",
"material_code"：""
}]
}
1 mobile_no String null 补货人员手机号(工号和手机号必须传其中一
个)
2 replenish_no String Not null 补货单号
3 cutting_no String Not null 刀柜编号（刀柜编号和刀柜名称二选一不为空）
4 token String Not null 认证 token
5 work_no String Null 工号
6 addList List<Obj
ect>
Not null 详情数据集
7 box_number Integer Not Null 补货数量
8 item_no_alias String Not null 货道别名(支持扩展货道 如:A001#)
9 material_code String Null 物料代码(传了物料代码会根据物料代码查询是
否同该货道号绑定的一致)
10 cutting_name String Not null 刀柜名称（刀柜编号和刀柜名称二选一不为空）

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
Demo:
```

### 46. 删除用户信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/deleteUserInfo` |
| 完整 URL | `https://xxx/plat/cutterApi/deleteUserInfo` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明： 根据用户手机号码删除用户信息
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/deleteUserInfo
完整 url https://xxx/plat/cutterApi/deleteUserInfo
请求方式 Post

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 mobileNo String Not null 需要删除的用户信息的手机号码

- 返回值：如下参数
序号 参数名称 说明
1 code OK：删除成功
其他：删除失败
Demo:
```

### 47. 查询公司下的车间及设备信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryWorkshopAndDevice` |
| 完整 URL | `https://xxx/plat/cutterApi/queryWorkshopAndDevice` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 查询登录账户的公司车间及车间下设备信息
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryWorkshopAndDevice
完整 url https://xxx/plat/cutterApi/queryWorkshopAndDevice
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 id id
2 company 公司名称
3 factory_name 工厂名称
4 workshop_name 车间名称
5 device_no 设备号
6 serial_num 设备位置号
7 code OK：成功 其他：失败
8 {
"status": 1,
"code": "OK",
"message": "操作成功",
"data": [
{
"id": 853,
"company": "深圳丹弗科技有限公司",
"factory_name": "机加工厂",
"workshop_name": "机加车间",
"machines": [
{
"device_no": "xzgxkj-A001",
"serial_num": "A001"
}
]
}
]
}
Demo:
```

### 48. 按时间查询所有刀柜货道库存变更记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/trackStock` |
| 完整 URL | `https://xxx/plat/cutterApi/trackStock` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 按时间查询所有刀柜货道库存变更记录
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/trackStock
完整 url https://xxx/plat/cutterApi/trackStock
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 star String Not null yyyy-MM-dd HH:mm:ss
3 finish String Not null yyyy-MM-dd HH:mm:ss
4 page String Not null 页数
5 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 code OK：成功 其他：失败
6 {
"code": "OK",
"data": {
"total": 43,
"pageCount": 43,
"currentPage": 1,
"numPerPage": 1,
"rows": [
{
"id": id,
"cCount": 变更数量,
"remake": 备注,
"createTime": 操作时间,
"createBy": 操作人,
"brandId": 耗材 ID,
"brandName":品牌,
"productName": 型号,
"specification": 规格,
"company": 公司,
"new_repertory": 操作后库存,
"old_repertory": 操作前库存,
"cuttingNo": 刀柜编号,
"cuttingName": 刀柜名称,
"factoryName": 工厂,
"workshopName": 车间,
"itemNoAlias": 货道别名,
"materialCode": 物料编码,
"remark_i18n": 根据用户登录语
言翻译后的备注,
"cType": 类型,
"cDetails": 详情,
"createByWorkNo": 创建人工号
}
]
}
}
Demo:
```

### 49. 按时间查询所有操作日志

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/operationLog` |
| 完整 URL | `https://xxx/plat/cutterApi/operationLog` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 按时间查询所有操作日志
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/operationLog
完整 url https://xxx/plat/cutterApi/operationLog
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 star String Not null yyyy-MM-dd HH:mm:ss
3 finish String Not null yyyy-MM-dd HH:mm:ss
4 page String Not null 页数
5 rows String Not null 每页行数（最大值为 20，本地部署最
大 100）

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 code OK：成功 其他：失败
6 {
"code": "OK",
"data": {
"total": 43,
"pageCount": 43,
"currentPage": 1,
"numPerPage": 1,
"rows": [
{
"id": id,
"cCount": 变更数量,
"remake": 备注,
"createTime": 操作时间,
"createBy": 操作人,
"brandId": 耗材 ID,
"brandName":品牌,
"productName": 型号,
"specification": 规格,
"company": 公司,
"new_repertory": 操作后库存,
"old_repertory": 操作前库存,
"cuttingNo": 刀柜编号,
"cuttingName": 刀柜名称,
"factoryName": 工厂,
"workshopName": 车间,
"itemNoAlias": 货道别名,
"materialCode": 物料编码,
"order_no": 订单号,
"agent_code": 供应商公司编码,
"bind_num": 包装数量,
"remark_i18n": 根据用户登录语
言翻译后的备注,
"cType": 类型
"cDetails": 详情,
"createByWorkNo": 创建人工号
}
]
}
}
Demo:
```

### 50. 查询公司下的车间（新版本）

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryWorkshopV2` |
| 完整 URL | `https://xxx/plat/cutterApi/queryWorkshopV2` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 查询登录账户的公司车间，分页展示
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryWorkshopV2
完整 url https://xxx/plat/cutterApi/queryWorkshopV2
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 page String Not null 页数
3 rows String Not null 每页行数（最大值为 50，本地部署最
大值 100）

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 code OK：成功 其他：失败
6 row id: id
company: 公司名称
factory_name: 工厂名称
workshop_name: 车间名称
alias_workshop_name: 车间别名
alias_factory_name: 工厂别名
factory_pid : 工厂 id
order_id: 排序号
Demo:
```

### 51. 查询公司下的车间及设备信息（新版本）

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/queryWorkshopAndDeviceV2` |
| 完整 URL | `https://xxx/plat/cutterApi/queryWorkshopAndDeviceV2` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明： 查询登录账户的公司车间及车间下设备信息
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/queryWorkshopAndDeviceV2
完整 url https://xxx/plat/cutterApi/queryWorkshopAndDeviceV2
请求方式 Get

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token

- 返回值：如下参数
序号 参数名称 说明
1 id id
2 company 公司名称
3 factory_name 工厂名称
4 workshop_name 车间名称
5 alias_factory_name 工厂别名
6 alias_workshop_name 车间别名
7 order_id 排序号
8 device_no 设备号
9 serial_num 设备位置号
10 code OK：成功 其他：失败
11 {
"status": 1,
"code": "OK",
"message": "操作成功",
"data": [
{
"id": 853,
"company": "深圳丹弗科技有限公司",
"factory_name": "机加工厂",
"workshop_name": "机加车间",
"machines": [
{
"device_no": "xzgxkj-A001",
"serial_num": "A001"
}
]
}
]
}
Demo:
```

### 52. 通过物料代码批量同步耗材信息

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/upsert` |
| 完整 URL | `https://xxx/plat/cutterApi/upsert` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：当前直接只支持有物料代码的耗材信息同步，该接口会根据物料代码更新、插入
耗材信息，如果物料代码存在，会覆盖原有的型号、规格、品牌、单价属性值，慎调
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/upsert
完整 url https://xxx/plat/cutterApi/upsert
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 brand_name String Not null 品牌名称
3 product_name String Not null 刀具型号
4 specification String Not null 规格
5 price double Not null 单价(不传默认值为 0，会把原有单价
更新为 0)
6 cutter_type String Not null 刀具类别
7 material_code String Not null 物料代码

- 返回值：如下参数
序号 参数名称 说明
1 成功：code 值为 OK
{
"status": 1,
"code": "OK",
"message": "成功更新数据 1 条，新增数据 1 条,
型号、规格、品牌存在冲突数据 1 条，冲突数据如下：[型
号:Circular Saw Blade 规格:165mm x 21mm 品
牌:Bosch 物料代码:BOS-166TCT] ",
"data": null,
"duration": 0,
"errorCode": null,
"success": false
}
失败： code 值为 FAILED
{
"status": 0,
"code": "FAILED",
"message": "xxxx",
"data": null,
"duration": 0,
"errorCode": null,
"success": false
}
Demo:
```

### 53. 查询工序列表

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：查询当前用户公司下的工序列表（不包含工序刀单和工序工单信息）
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program
完整 url https://xxx/plat/cutterApi/program
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 work_process String null 工序名称
3 page Integer null 当前页数，默认为 1
4 rows Integer null 每页行数，默认为 15（最大值为 20，
本地部署最大 100）
示例：

- 返回值：如下参数
序号 参数名称 说明
1 currentPage 当前页数
2 numPerPage 页面数据条数
3 pageCount 总页数
4 total 数据总数
5 recordList id: 工序 id,
company: 公司名称,
modify_by: 修改人,
last_time: 修改时间,
create_time: 创建时间,
create_by: 创建人,
state: 工序状态 1-启用 2-禁用,
work_process: 工序名称
6 code OK：成功 其他：失败
7 message 提示信息
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": {
"currentPage": 1,
"numPerPage": 10,
"totalCount": 1,
"recordList": [
{
"id": 80,
"company": "东莞 xxx 精密机械有限公司",
"modify_by": null,
"last_time": null,
"create_time": "2025-09-16 15:15:40",
"create_by": "小红",
"state": 1,
"work_process": "测试 API 工序工单 4"
}
]
},
"duration": 0,
"errorCode": null,
"success": false
}
```

### 54. 查询工序详情

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program/` |
| 请求方式 | `GET` |

#### 原文整理

```text
- 说明：根据工序 id 查询当前用户公司下的工序详情（包含工序刀单和工序工单信息）
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program/{id}
完整 url https://xxx/plat/cutterApi/program/{id}
请求方式 GET

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 id String Not null 工序 id（从接口 53 中获取）
示例：

- 返回值：如下参数
序号 参数名称 说明
1 id 工序 id
2 company 公司名称
3 is_del 是否删除 1-已删除 2-未删除
4 del_time 删除时间
5 modify_by 修改人
6 last_time 修改时间
7 create_time 创建时间
8 create_by 创建人
9 state 工序状态 1-启用 2-禁用
10 work_process 工序名称
11 cutterProgramInfoVO
List
id: 工序刀单 id,
cutter_program_id: 工序 id,
company: 公司名称,
cutting_tools_brand_id: 耗材 id,
ct_no: T 位号，
ct_lift: 刀具寿命,
program_name: 程序名称,
product_name: 刀具产品名称,
brand_name: 刀具品牌名称,
specification: 刀具规格,
cutter_type: 刀具类型,
material_code: 刀具物料代码
12 productOrderVOList id: 工单 id,
productOrder: 工单名称,
use_num: 刀具使用数量,
createTime: 创建时间
13 code OK：成功 其他：失败
14 message 提示信息
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": {
"id": 80,
"company": "东莞 xxx 精密机械有限公司",
"is_del": 1,
"del_time": null,
"modify_by": "陈铭昭",
"last_time": "2025-09-16 16:49:02",
"create_time": "2025-09-16 15:15:40",
"create_by": "陈铭昭",
"state": 1,
"work_process": "测试 API 工序工单 4",
"cutterProgramInfoVOList": [
{
"id": 917,
"cutter_program_id": 80,
"company": "东莞 xxx 精密机械有限公司",
"cutting_tools_brand_id": 426259,
"ct_no": "1",
"ct_lift": 0.0,
"program_name": "",
"product_name": "测试 API 耗材 2",
"brand_name": "CYBER",
"specification": "测试 API 耗材",
"cutter_type": "车削刀具",
"material_code": "ceshiapi2"
}
],
"productOrderVOList": [
{
"id": 216,
"productOrder": "111222",
"use_num": 0,
"createTime": "2025-09-16 15:15:40"
}
]
},
"duration": 0,
"errorCode": null,
"success": false
}
```

### 55. 新增工序刀单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program/cutter` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：新增/编辑工序和工序刀单
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program/cutter
完整 url https://xxx/plat/cutterApi/program/cutter
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 id Long null 工序 id。id 为空时，默认为新增工
序。若不为空，则视为编辑工序信息
（工序 id 从接口 53 中获取）
3 work_process String Not null 工序名称
4 state Integer Not null 工序状态 1-启用 2-禁用
5 cutters Array[Object] Null 工序刀单信息（为空时则只添加工序
信息，不绑定工序刀单）
6 cutters: id Integer Null 工序刀单 id。工序 id 为空时，默认
为新增工序刀单。若不为空，则视为
编辑工序刀单信息（工序刀单 id 从
接口 54 中获取）
7 cutters:
material_code
String Not null 物料代码
8 cutters: ct_lift Integer Null 刀具寿命（寿命刀必填）
9 cutters: ct_no Integer Not null T 位号
示例：

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 message 提示信息
3 data 工序 id
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": 81,
"duration": 0,
"errorCode": null,
"success": false
}
```

### 56. 删除工序

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program/` |
| 请求方式 | `DELETE` |

#### 原文整理

```text
- 说明：删除工序
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program/{id}
完整 url https://xxx/plat/cutterApi/program/{id}
请求方式 DELETE

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 id Long Not null 工序 id（从接口 53,54,55,58 获取）
示例：

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 message 提示信息
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": null,
"duration": 0,
"errorCode": null,
"success": false
}
```

### 57. 删除工序刀单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program/cutter` |
| 请求方式 | `DELETE` |

#### 原文整理

```text
- 说明：删除工序中的刀单
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program/cutter
完整 url https://xxx/plat/cutterApi/program/cutter
请求方式 DELETE

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 id Long Not null 工序 id（从接口 54 获取）
3 deletedProgramInfoI
ds
Array Not null 工序刀单 id 列表（从接口 54 获取）
示例：

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 message 提示信息
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": null,
"duration": 0,
"errorCode": null,
"success": false
}
```

### 58. 新增工序工单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program/product` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：新增工序和产品工单，如果产品工单已存在则直接进行绑定，否则创建产品工单
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program/product
完整 url https://xxx/plat/cutterApi/program/product
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 id Long null 工序 id。id 为空时，默认为新增工
序。若不为空，则视为编辑工序信息
（工序 id 从接口 53 中获取，或者在
本接口新增成功后获取）
3 work_process String Not null 工序名称
4 state Integer Not null 工序状态 1-启用 2-禁用
5 product Object Null 产品工单信息（为空时则只添加工序
信息，不绑定产品工单）
6 product:
productOrder
Integer Not Null 产品/工单名称（如果产品/工单名称
已存在，直接绑定已有产品/工单，
否则创建新产品/工单并进行绑定）
7 product: orderState Integer Null 产品工单状态 1-正常 2-失效（创建
产品工单时必填）
8 product: order_no String Null 工单编码
9 product:
product_num
Integer Null 产品数量
示例：

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 message 提示信息
3 data 工序 id
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": 82,
"duration": 0,
"errorCode": null,
"success": false
}
```

### 59. 删除工序工单

| 项 | 内容 |
| --- | --- |
| 接口名称 | `cutterApi/program` |
| 完整 URL | `https://xxx/plat/cutterApi/program/product` |
| 请求方式 | `DELETE` |

#### 原文整理

```text
- 说明：删除工序和产品工单的关联关系
登录成功且有操作小程序权限

- 名称
接口名称 cutterApi/program/product
完整 url https://xxx/plat/cutterApi/program/product
请求方式 DELETE

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 id Long Not null 工序 id（从接口 54 获取）
3 deletedProductOrderIds Array Not null 产品/工单 id 列表（从接口 54 获取）
示例：

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 message 提示信息
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": null,
"duration": 0,
"errorCode": null,
"success": false
}
```

### 60. 新增盘点记录

| 项 | 内容 |
| --- | --- |
| 接口名称 | `plat/cutterApi/inventoryRecord` |
| 完整 URL | `https://xxx/plat/cutterApi/inventoryRecord` |
| 请求方式 | `POST` |

#### 原文整理

```text
- 说明：新增盘点历史记录信息
登录成功且有操作小程序权限

- 名称
接口名称 plat/cutterApi/inventoryRecord
完整 url https://xxx/plat/cutterApi/inventoryRecord
请求方式 POST

- 入参：需要如下参数
序号 参数名称 类型 允许为空 说明
1 token String Not null 认证 token
2 invoiceNo String Null 单据编号
3 inventoryCheckDay String Null 盘点时间（YYYY-MM-dd HH:mm:ss）
不传默认为当前时间
4 cuttingNo String Not null 柜子编号
5 phoneNo String Null 盘点人手机号（必须是系统存在的手
机号，不填默认当前登录人）
6 remark String Null 备注
7 stockInfos List Not null 盘点明细
8 itemNoAlias String Not null 货道编号（如：A001、A002）
9 materialCode String null 物料代码和（型号、规格、品牌）必
传一个
10 brandName String null 品牌
11 productName String null 型号
12 specification String null 规格
13 quantity int null 数量（盒），大于 0 货道库存增加，
小于 0 货道库存扣减，如果开启货道
库存同步总库存，会增加、扣减耗材
总库存,默认 0
14 {
"invoiceNo": "NO56535187",
"inventoryCheckDay": "2026-01-23 10:00:00",
"cuttingNo": "DF20240904007",
"phoneNo":"135xxx",
"remark":"盘点备注",
"stockInfos": [
{
"itemNoAlias" : "A001",
"materialCode" : "",
"brandName" : "淘卡特",
"productName" : "淘卡特",
"specification" : "RLD-50 四刃圆鼻",
"quantity": 1
}
]
}
示例：

- 返回值：如下参数
序号 参数名称 说明
1 code OK：成功 其他：失败
2 message 提示信息
示例:
{
"status": 1,
"code": "OK",
"message": "操作成功",
"data": null,
"duration": 0,
"errorCode": null,
"success": false
}
```
