### **1\. 登录**

这部分只有一个接口，用于用户登录系统。


#### **1.1 手机号密码登录**

* **接口功能**: 使用用户的手机号、密码以及公司授权码进行登录。
*  **API授权地址**:https://apict.jijiayun.com  
* **接口地址 (URL)**: http://xxx/cutter/toolCabinetApi/checkPassWordLogin  
* **请求方式**: POST  
* **Content-Type**: application/json;charset=UTF-8

#### **请求参数 (Request)**

由于此接口的参数是在URL中传递的，它没有JSON格式的请求体（Request Body）。参数直接附加在URL后面，格式如下：

?mobile=用户手机号\&passWord=用户密码\&token\_code=公司授权码

#### **响应数据 (Response)**

**✅ 成功响应 (Success Response)**

* HTTP Status: 200 OK  
* Body (JSON):

{  
    "status": 1,  
    "code": "OK",  
    "message": "操作成功",  
    "data": {  
        "serverUrl": "https://dev.danfoo.com/",  
        "token": "0eaf9a024b1d13fb78a69d93086ff172",  
        "user": {  
            "id": 2,  
            "userId": "fe0ef3c9-6cb2-40cf-bfe9-d1acbfae0988",  
            "userName": "yingying4485",  
            "name": "英英",  
            "sex": 0,  
            "tel": "",  
            "mobileNo": "15107551016",  
            "remark": "",  
            "createTime": "2022-07-06 15:57:19",  
            "company": "智能工具柜2024年1月份版本预测",  
            "logogram\_company": "沃尔孚",  
            "factoryMapConfigList": \[  
                {  
                    "factoryPid": 1103,  
                    "factoryName": "深圳工厂",  
                    "id": 1736,  
                    "workShopName": "宝安车间"  
                }  
            \]  
        }  
    },  
    "duration": 0,  
    "errorCode": null,  
    "success": false  
}

**❌ 失败响应 (Failure Response)**

* HTTP Status: (通常是 200 OK 但业务失败)  
* Body (JSON):

{  
    "status": 0,  
    "code": "FAILED",  
    "message": "mobile or password or tokenCode is null", // 具体的错误信息  
    "data": null,  
    "duration": 0,  
    "errorCode": null,  
    "success": false  
}

**通用说明**:

* 文档中提到，所有接口返回的 code: "OK" 代表请求成功。  
* 除了登录接口，其他所有接口的请求都需要在请求头 (Header) 中携带登录后获取的 token。

### 

### **2\. 内容显示**

#### **2.1 货道库存入库 (按物料信息)**

* **接口功能**: 根据物料的详细信息（型号、规格等）来更新指定工具柜中货道的库存。这个操作只会影响货道库存，不会改变物料的总库存。  
  * **重要限制**: 一个物料在单个柜子中只能占用一个货道，否则会操作失败。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/updateAisleInventoryByMaterial  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。登录时获取的访问令牌。  
* **请求体 (Body \- JSON)**:

{

    "productName": "物料型号",

    "specification": "物料规格",

    "brandName": "品牌名称",

    "cutterType": "物料类别",

    "number": 10,

    "cuttingNo": "柜子编号"

}

* **请求体参数说明**:  
  * productName (String): **必填**，物料的型号。  
  * specification (String): **必填**，物料的规格。  
  * brandName (String): **必填**，品牌名称。  
  * cutterType (String): **必填**，类别。  
  * number (Integer): **必填**，更新的数量。正数表示入库，负数表示出库。  
  * cuttingNo (String): **必填**，要操作的工具柜的编号。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "修改货道库存成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "变更后的货道库存大于货道容量", // 或其他失败原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.2 货道库存入库 (按货道别名)**

* **接口功能**: 通过货道的“别名”来直接更新库存。同样，这个操作也只影响货道库存，不影响物料总库存。  
  * **重要限制**: 货道别名必须是唯一的，不能有多个货道使用相同的别名，否则会失败。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/updateAisleInventoryByChannel  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **请求体 (Body \- JSON)**:

{

    "aisle": "A01-01",

    "number": 5,

    "cuttingNo": "柜子编号"

}

* **请求体参数说明**:  
  * aisle (String): **必填**，货道的别名。  
  * number (Integer): **必填**，更新的数量。正数入库，负数出库。  
  * cuttingNo (String): **必填**，工具柜的编号。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "修改货道库存成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "数量不能为0", // 或其他失败原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

### 

#### **2.3 物料库存出入库**

* **接口功能**: 对物料的总库存进行入库或出库操作。这个操作会直接增减物料的总库存量。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/inOrOutStorage  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。登录时获取的访问令牌。  
* **请求体 (Body \- JSON)**:

{

    "productName": "物料型号",

    "specification": "物料规格",

    "brandName": "品牌名称",

    "cutterType": "物料类别",

    "number": \-5,

    "cuttingNo": "柜子编号",

    "materialCode": "MTRL-001"

}

* **请求体参数说明**:  
  * productName (String): **必填**，物料的型号。  
  * specification (String): **必填**，物料的规格。  
  * brandName (String): **必填**，品牌名称。  
  * cutterType (String): **必填**，类别。  
  * number (Integer): **必填**，更新的数量。正数表示入库，负数表示出库。  
  * cuttingNo (String): **必填**，相关的工具柜编号。  
  * materialCode (String): *可选*，物料的代码。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "出库成功", // 或 "入库成功"

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "数量不能为0", // 或其他失败原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

### 

#### **2.4 根据归还时间获取领用记录**

* **接口功能**: 根据**归还时间**范围，分页查询物料的领用记录。  
  * **重要限制**: 查询的时间范围不能超过7天。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/searchByReturnTime  
* **请求方式**: POST  
* **请求说明**: 这是一个 POST 请求，但其参数是通过 URL 查询字符串 (Query String) 传递的，没有请求体 (Request Body)。

#### **2.5 根据领用时间获取领用记录**

* **接口功能**: 根据**领用时间**范围，分页查询物料的领用记录。  
  * **重要限制**: 查询的时间范围同样不能超过7天。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/searchByBorrowTime  
* **请求方式**: POST  
* **请求说明**: 与上一个接口类似，虽然是 POST 请求，但参数也是通过 URL 查询字符串传递。

### **请求参数 (适用于 2.4 和 2.5)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * star\_str: **必填**, 字符串 (String)。查询的开始时间，格式为 yyyy-MM-dd HH:mm:ss。  
  * end\_str: **必填**, 字符串 (String)。查询的结束时间，格式为 yyyy-MM-dd HH:mm:ss。  
  * page: **必填**, 字符串 (String)。需要查询的页码。  
  * rows: **必填**, 字符串 (String)。每页返回的数据条数，最大值为 100。  
* 请求示例 (URL):  
  https://xxx/cutter/toolCabinetApi/searchByBorrowTime?star\_str=2022-08-02%2000:00:00\&end\_str=2022-08-03%2000:00:00\&page=1\&rows=10

### **响应数据 (适用于 2.4 和 2.5)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "操作成功",

    "data": {

        "total": 25,

        "pageCount": 3,

        "numPerPage": 10,

        "currentPage": 1,

        "rows": \[

            {

                "id": 123,

                "cuttingNo": "柜子编号01",

                "cuttingName": "一号柜",

                "company": "xxx有限公司",

                "factoryName": "深圳工厂",

                "workshopName": "宝安车间",

                "productName": "物料名称(型号)",

                "specification": "物料规格",

                "brandName": "物料品牌",

                "price": 15.5,

                "materialCode": "MTRL-001",

                "imgUrl": "http://example.com/img.png",

                "consumableType": "物料类别",

                "payNum": 5,

                "packNum": 1,

                "cutterType": "物料类型",

                "payUserName": "领用人姓名",

                "payTime": "2022-08-02 10:00:00",

                "payWorkeNo": "领用人工号",

                "isReturn": 1, // 归还状态

                "itemNo": "A01", // 货道号

                "itemNoAlias": "货道别名",

                "itemNoPrefix": "A",

                "rUserName": "归还人名称",

                "rLastTime": "2022-08-02 18:00:00",

                "remark": "备注信息",

                "deviceNo": "设备号",

                "serialNum": "位置号",

                "rWorkeNo": "还刀人工号",

                "dWorkshopName": "设备所属车间",

                "dFactoryName": "设备所属工厂",

                "managerRepairState": "管理员修复状态",

                "exReport1": "一级异常理由",

                "exReport2": "二级异常理由",

                "exState": "异常状态",

                "exUserName": "异常上报人姓名",

                "exDate": "2022-08-02 11:00:00",

                "bcType": 1, // 状态: 1.普通 2.称重

                "singleWeight": 0.5,

                "packWeight": 0.1,

                "totalWeight": 2.6

            }

            // ... more records

        \]

    },

    "duration": 14,

    "errorCode": null,

    "success": false

}

* **响应数据说明**:  
  * data 对象中包含了分页信息 (total, pageCount 等) 和一个 rows 数组。  
  * rows 数组中的每个对象都是一条详细的领用记录，包含了物料、领用人、归还人、柜子、时间等多维度信息。

### 

#### **2.6 查询物料信息**

* **接口功能**: 分页查询物料信息，包括物料的总库存，并可以根据型号、规格、品牌等多种条件进行筛选。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/materialGrid  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * page: **必填**, 字符串 (String)。需要查询的页码。  
  * rows: **必填**, 字符串 (String)。每页返回的数据条数，最大值为 100。  
* **URL 请求示例**: https://xxx/cutter/toolCabinetApi/materialGrid?page=1\&rows=10  
* **请求体 (Body \- JSON)**:  
  * **说明**: 请求体中的所有参数都是*可选的*，用于筛选物料。如果不提供任何参数，将查询所有物料。

{

    "productName": "要筛选的型号",

    "specification": "要筛选的规格",

    "brandName": "要筛选的品牌",

    "cutterType": "要筛选的类别",

    "materialCode": "要筛选的物料代码"

}

#### **响应 (Response)**

**✅ 成功响应**

* **说明**: 响应数据 rows 数组中的每一个对象代表一个物料。其中包含一个名为 tools 的嵌套数组，列出了该物料被绑定在哪些货道上。

{

    "status": 1,

    "code": "OK",

    "message": "查询成功",

    "data": {

        "total": 128,

        "pageCount": 13,

        "numPerPage": 10,

        "currentPage": 1,

        "rows": \[

            {

                "id": 1186,

                "price": 50.0,

                "inventory": 18,

                "cutterType": "刀具",

                "inventoryWarn": 5,

                "company": "深圳丹弗科技有限公司",

                "materialCode": "896989",

                "brandId": 12,

                "productName": "物料名称(型号)",

                "imgId": 205,

                "specification": "物料规格",

                "brandName": "品牌名称",

                "imgUrl": "http://example.com/img.png",

                "consumableType": "耗材",

                "singleWeight": 0.2,

                "tools": \[

                    {

                        "surplus": 5,

                        "itemNoAlias": "A01-02",

                        "cuttingName": "一号柜",

                        "cuttingNo": "DF20230517001"

                    },

                    {

                        "surplus": 8,

                        "itemNoAlias": "B03-05",

                        "cuttingName": "二号柜",

                        "cuttingNo": "DF20230517002"

                    }

                \]

            }

            // ... 更多物料信息

        \]

    },

    "duration": 125,

    "errorCode": null,

    "success": false

}

### 

#### **2.7 查询用户信息**

* **接口功能**: 分页查询系统中的用户信息。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/searchUserList  
* **请求方式**: POST  
* **请求说明**: 这是一个 POST 请求，但其参数是通过 URL 查询字符串 (Query String) 传递的，没有请求体 (Request Body)。

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * page: **必填**, 字符串 (String)。需要查询的页码。  
  * rows: **必填**, 字符串 (String)。每页返回的数据条数，最大值为 100。  
* **URL 请求示例**: https://xxx/cutter/toolCabinetApi/searchUserList?page=1\&rows=50

#### **响应 (Response)**

**✅ 成功响应**

* **说明**: 响应数据 rows 数组中的每一个对象代表一个用户。

{

    "status": 1,

    "code": "OK",

    "message": "回调成功",

    "data": {

        "total": 34,

        "pageCount": 2,

        "numPerPage": 50,

        "currentPage": 1,

        "rows": \[

            {

                "id": 1,

                "name": "用户姓名",

                "mobileNo": "13800138000",

                "workeNo": "G00123",

                "ic\_no": "IC\_CARD\_001",

                "userState": 1

            },

            {

                "id": 2,

                "name": "另一位用户",

                "mobileNo": "13900139000",

                "workeNo": "G00124",

                "ic\_no": "IC\_CARD\_002",

                "userState": 2

            }

            // ... 更多用户信息

        \]

    },

    "duration": 0,

    "errorCode": null,

    "success": false

}

* **响应体字段说明**:  
  * id: 用户的记录ID。  
  * name: 姓名。  
  * mobileNo: 手机号。  
  * workeNo: 工号。  
  * ic\_no: IC卡号。  
  * userState: 用户状态 (1: 在职, 2: 离职)。

#### **2.8 查询单个柜子的货道详情**

* **接口功能**: 根据工具柜的编号，查询该柜子内所有货道的详细信息，包括货道容量、当前库存、以及货道上绑定的物料信息。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/searchItemList  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **请求体 (Body \- JSON)**:

{

    "cuttingNo": "F22471881"

}

* **请求体参数说明**:  
  * cuttingNo (String): **必填**，要查询的工具柜的编号。

#### **响应 (Response)**

**✅ 成功响应**

* **说明**: 响应数据 data 对象中包含一个 itemList 数组，数组中的每个对象都代表一个货道的详细信息。其中 boxinfoVo 是一个数组，包含了绑定在该货道上的物料信息。

{

    "status": 1,

    "code": "OK",

    "message": "查询成功",

    "data": {

        "itemList": \[

            {

                "id": 978,

                "inventory": 100,

                "surplus": 50,

                "itmeNo": "1",

                "itmeNoAsc": null,

                "disItemNo": 1,

                "bindNum": 10,

                "itemNoAlias": "A01-01",

                "itemNoPrefix": "A",

                "company": "xxx有限公司",

                "bcType": 1,

                "packWeight": 0.5,

                "boxinfoVo": \[

                    {

                        "price": 25.0,

                        "cutterType": "刀具",

                        "specification": "型号A",

                        "brandName": "品牌B",

                        "productName": "物料名称(型号A)",

                        "consumableType": "耗材",

                        "singleWeight": 0.1

                    }

                \]

            }

            // ... 更多货道信息

        \]

    },

    "duration": 0,

    "errorCode": null,

    "success": false

}

* **响应体关键字段说明**:  
  * itemList: 货道列表数组。  
    * id: 货道记录ID。  
    * inventory: 货道容量（能放多少）。  
    * surplus: 货道当前库存。  
    * itmeNo: 货道号。  
    * itemNoAlias: 货道别名。  
    * boxinfoVo: 货道上绑定的物料信息数组。

#### **2.9 查询当前公司下所有柜子编号和名称**

* **接口功能**: 分页查询当前公司下所有的工具柜列表，返回每个柜子的编号、名称和别名。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/searchToolCabinetList  
* **请求方式**: POST  
* **请求说明**: 这是一个 POST 请求，但其分页参数是通过 URL 查询字符串 (Query String) 传递的，没有请求体 (Request Body)。

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * page: **必填**, 字符串 (String)。需要查询的页码。  
  * rows: **必填**, 字符串 (String)。每页返回的数据条数，最大值为 100。  
* URL 请求示例:  
  https://xxx/cutter/toolCabinetApi/searchToolCabinetList?page=1\&rows=10

#### **响应 (Response)**

**✅ 成功响应**

* **说明**: 响应数据 rows 数组中的每一个对象代表一个工具柜。

{

    "status": 1,

    "code": "OK",

    "message": "查询成功",

    "data": {

        "total": 5,

        "pageCount": 1,

        "numPerPage": 10,

        "currentPage": 1,

        "rows": \[

            {

                "id": 1,

                "cuttingNo": "DF20230517001",

                "cuttingName": "一号测试柜",

                "cuttingAlias": "Test-01"

            },

            {

                "id": 2,

                "cuttingNo": "DF20230517002",

                "cuttingName": "二号生产柜",

                "cuttingAlias": "Prod-02"

            }

            // ... 更多工具柜信息

        \]

    },

    "duration": 97,

    "errorCode": null,

    "success": false

}

* **响应体字段说明**:  
  * id: 工具柜记录ID。  
  * cuttingNo: 工具柜的唯一编号。  
  * cuttingName: 工具柜的名称。  
  * cuttingAlias: 工具柜的别名。

#### **2.10 添加用户记录**

* **接口功能**: 在系统中添加一个新的用户记录。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/apiAddUser  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **请求体 (Body \- JSON)**:

{

    "name": "新用户姓名",

    "mobileNo": "13700137000",

    "passwd": "userpassword",

    "ic\_no": "IC\_CARD\_003",

    "workeNo": "G00125",

    "user\_factory": "深圳工厂",

    "userDepartment": "生产部"

}

* **请求体参数说明**:  
  * name (String): **必填**，用户姓名。  
  * mobileNo (String): **必填**，用户手机号码，将作为登录账号。  
  * passwd (String): **必填**，用户密码。  
  * ic\_no (String): *可选*，用户的IC卡号。  
  * workeNo (String): *可选*，用户的工号。  
  * user\_factory (String): *可选*，用户所属车间。  
  * userDepartment (String): *可选*，用户所属部门。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "添加成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "用户已存在", // 或其他失败原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.11 修改用户记录**

* **接口功能**: 根据手机号定位用户，并修改其姓名、密码或在职状态。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/apiUpdateUser  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **请求体 (Body \- JSON)**:

{

    "mobileNo": "13700137000",

    "name": "修改后的姓名",

    "passwd": "newuserpassword",

    "userState": 1

}

* **请求体参数说明**:  
  * mobileNo (String): **必填**，要修改的用户的手机号码。  
  * name (String): *可选*，新的用户姓名。  
  * passwd (String): *可选*，新的用户密码。  
  * userState (Integer): **必填**，用户状态（1: 在职, 2: 离职）。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "修改用户信息成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "该公司下没有此用户", // 或其他失败原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

### 

#### **2.12 新增物料**

* **接口功能**: 在系统中添加一种新的物料信息。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/insertMaterial  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **请求体 (Body \- JSON)**:

{

    "productName": "新型号物料",

    "specification": "新规格",

    "brandName": "新品牌",

    "cutterType": "刀具",

    "price": 99.9,

    "consumableType": "1",

    "materialCode": "NEW-MTRL-001"

}

* **请求体参数说明**:  
  * productName (String): **必填**，型号。  
  * specification (String): **必填**，规格。  
  * brandName (String): **必填**，品牌。  
  * cutterType (String): **必填**，类别。  
  * price (Double): **必填**，单价。  
  * consumableType (String): **必填**，物料类型 ("1"代表物料，"2"代表耗材)。  
  * materialCode (String): *可选*，物料代码。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "添加物料成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应 (示例)**

{

    "status": 0,

    "code": "FAILED",

    "message": "物料已存在,请不要重复添加", // 或 "操作失败,物料代码在型号为'xxx'的物料中使用"

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.13 查询预警物料**

* **接口功能**: 分页查询库存量低于预警线的物料。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/findInventoryAlarmMaterial  
* **请求方式**: POST  
* **请求说明**: 这是一个 POST 请求，但其分页参数是通过 URL 查询字符串 (Query String) 传递的，没有请求体。

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * page: **必填**, 字符串 (String)。需要查询的页码。  
  * rows: **必填**, 字符串 (String)。每页返回的数据条数，最大值为 100。  
* URL 请求示例:  
  https://xxx/cutter/toolCabinetApi/findInventoryAlarmMaterial?page=1\&rows=10

#### **响应 (Response)**

**✅ 成功响应**

* **说明**: 返回的数据结构与 2.6 查询物料信息 类似，但只包含达到预警条件的物料。

{

    "status": 1,

    "code": "OK",

    "message": "查询成功",

    "data": {

        "total": 5,

        "pageCount": 1,

        "numPerPage": 10,

        "currentPage": 1,

        "rows": \[

            {

                "id": 1186,

                "price": 50.0,

                "inventory": 3,

                "cutterType": "刀具",

                "inventoryWarn": 5,

                "company": "深圳丹弗科技有限公司",

                "materialCode": "896989",

                "brandId": 12,

                "productName": "物料名称(型号)",

                "specification": "物料规格",

                "brandName": "品牌名称",

                "imgUrl": "http://example.com/img.png",

                "imgId": 205,

                "consumableType": "耗材",

                "singleWeight": 0.2

            }

            // ... 更多预警物料信息

        \]

    },

    "duration": 0,

    "errorCode": null,

    "success": false

}

* **响应体关键字段**:  
  * inventory: 当前物料总库存。  
  * inventoryWarn: 此物料设置的告警数量（告警线）。当 inventory 低于等于 inventoryWarn 时，会出现在此列表。

#### **2.14 查询项目管理**

* **接口功能**: 分页查询项目管理列表，并可根据项目名称和状态进行筛选。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/findProjectManagementList  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * page: **必填**, 字符串 (String)。  
  * rows: **必填**, 字符串 (String)，最大值为 100。  
* URL 请求示例:  
  https://xxx/cutter/toolCabinetApi/findProjectManagementList?page=1\&rows=10  
* **请求体 (Body \- JSON)**:

{

    "projectName": "要查询的项目名称",

    "projectState": 0

}

* **请求体参数说明**:  
  * projectName (String): *可选*，项目名称，用于模糊查询。  
  * projectState (Integer): **必填**，项目状态 (0: 所有, 1: 启用, 2: 失效)。

#### **响应 (Response)**

{

    "status": 1,

    "code": "OK",

    "message": "查询成功",

    "data": {

        "total": 1,

        "pageCount": 1,

        "numPerPage": 10,

        "currentPage": 1,

        "rows": \[

            {

                "id": 150,

                "company": "深圳丹弗科技有限公司",

                "projectName": "2024年7月5日项目001",

                "projectNo": "PJ-20240705-001",

                "projectState": 1

            }

            // ...更多项目

        \]

    },

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.15 新增项目管理**

* **接口功能**: 创建一个新的项目。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/insertProjectAPI  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**: token (必填)  
* **请求体 (Body \- JSON)**:

{

    "projectName": "API创建的项目MAN11",

    "projectNo": "APIMANCODE",

    "projectState": "1"

}

* **请求体参数说明**:  
  * projectName (String): **必填**，项目名称。  
  * projectNo (String): **必填**，项目编码。  
  * projectState (String): **必填**，项目状态 ("1": 启用, "2": 失效)。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "添加物料成功", // 注意：这里的message可能是拷贝的，实际应为"添加项目成功"

    "data": {

        "id": 20,

        "company": "xxxx有限公司",

        "projectName": "apiCCMAN11",

        "projectNo": "APIMANCODE",

        "projectState": 1

    },

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "项目名称重复", // 或 "参数异常"

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.16 编辑项目管理**

* **接口功能**: 根据项目ID，编辑已有的项目信息。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/updateProjectOneAPI  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**: token (必填)  
* **请求体 (Body \- JSON)**:

{

    "Id": 20,

    "projectName": "修改后的项目名称",

    "projectNo": "MODIFIED-CODE",

    "projectState": "1",

    "company": "xxxx有限公司"

}

* **请求体参数说明**:  
  * Id (Integer): **必填**，要编辑的项目ID。  
  * projectName (String): **必填**，项目名称。  
  * projectNo (String): **必填**，项目编码。  
  * projectState (String): **必填**，项目状态 ("1": 启用, "2": 失效)。  
  * company (String): **必填**，公司名称。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "操作成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "项目名称重复", // 或 "参数异常"

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

### 

#### **2.17 查询工具柜**

* **接口功能**: 分页查询当前公司下的工具柜详细信息列表。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/cabinetListapi  
* **请求方式**: POST  
* **请求说明**: 这是一个 POST 请求，但其分页参数是通过 URL 查询字符串 (Query String) 传递的，没有请求体。

#### **请求 (Request)**

* **请求头 (Headers)**:  
  * token: **必填**, 字符串 (String)。  
* **URL 参数 (Query Params)**:  
  * page: **必填**, 字符串 (String)。  
  * rows: **必填**, 字符串 (String)，最大值为 100。  
* URL 请求示例:  
  https://xxx/cutter/toolCabinetApi/cabinetListapi?page=1\&rows=10

#### **响应 (Response)**

{

    "status": 1,

    "code": "OK",

    "message": "查询成功",

    "data": {

        "total": 6,

        "pageCount": 1,

        "numPerPage": 15,

        "currentPage": "1",

        "rows": \[

            {

                "id": 7,

                "cuttingNo": "DF20230517001",

                "cuttingName": "测试主副柜",

                "company": "东莞xxx精密机械有限公司",

                "factoryName": "机加云工厂",

                "workshopName": "机加云A车间",

                "isOnline": "2",

                "isSale": "1",

                "factoryConfigId": "1007",

                // ... 还有很多其他柜子相关的详细字段

                "ctType": "1"

            }

        \]

    },

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.18 货道绑定**

* **接口功能**: 将一个具体的物料绑定到一个指定的、空的货道上。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/CargoPathBindingApi  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**: token (必填)  
* **请求体 (Body \- JSON)**:

{

    "Id": 978,

    "bindNum": 10,

    "inventory": 100,

    "surplus": 50,

    "brandName": "品牌B",

    "materialCode": "MTRL-001",

    "specification": "型号A",

    "consumableType": "耗材"

}

* **请求体参数说明**:  
  * Id (Integer): **必填**，货道的ID。  
  * bindNum (Integer): **必填**，包装数量。  
  * inventory (Integer): *可选*，货道容量。  
  * surplus (Integer): *可选*，货道库存。  
  * brandName (String): **必填**，品牌。  
  * materialCode (String): *可选*，物料代码。  
  * specification (String): **必填**，规格。  
  * consumableType (String): **必填**，类型。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "操作成功",

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "该货道不存在或者不是空货道", // 或其他失败原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

#### **2.19 新增领料单**

* **接口功能**: 新增一张领料单。如果单号已存在且未完成，则追加物料；如果单号不存在，则创建新单。  
* **接口地址 (URL)**: https://xxx/cutter/toolCabinetApi/addPickingList  
* **请求方式**: POST  
* **Content-Type**: application/json; charset=UTF-8

#### **请求 (Request)**

* **请求头 (Headers)**: token (必填)  
* **请求体 (Body \- JSON)**:

{

    "materialReqNo": "KKK",

    "materials": "\[{\\"materialId\\":631,\\"bindTotal\\":10}, {\\"materialId\\":582,\\"bindTotal\\":98}\]"

}

* **请求体参数说明**:  
  * materialReqNo (String): **必填**，领料单号。  
  * materials (String): *可选*，一个包含物料ID和领取数量的 **JSON字符串**。  
    * materialId (Integer): 物料ID。  
    * bindTotal (Integer): 领取数量。

#### **响应 (Response)**

**✅ 成功响应**

{

    "status": 1,

    "code": "OK",

    "message": "操作成功",

    "data": 67, // 返回领料单的ID

    "duration": 6,

    "errorCode": null,

    "success": false

}

**❌ 失败响应**

{

    "status": 0,

    "code": "FAILED",

    "message": "新增领料单异常,因为:物料id:631在该领料单中已存在", // 或库存不足等其他原因

    "data": null,

    "duration": 0,

    "errorCode": null,

    "success": false

}

