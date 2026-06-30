# 司库融资看板

一个面向集团司库和融资管理的本地/局域网看板工具。管理员在服务端上传最新“集团公司融资情况表”后，同一局域网内的同事打开浏览器地址即可查看融资余额、期限压力、融资品种结构、利率成本和融资明细。

> 适合场景：融资台账由人工维护，团队希望有一个低门槛、可局域网共享、数据不上传外网的看盘页面。

![司库融资看板示例](docs/images/dashboard-sample.png)

## About

司库融资看板是一个轻量级的集团融资管理工具。它把人工维护的 Excel 融资台账转成浏览器里的实时看板，用于快速查看融资余额、到期压力、融资成本、品种结构和明细筛选结果。项目默认在本机或局域网内运行，业务数据只保存在服务端电脑，不需要上传到外部平台。

## 先看这个

- 数据不会提交到 GitHub，运行数据位于 `data/`、`uploads/`，已被 `.gitignore` 排除。
- 示例 Excel 位于 [samples/集团公司融资情况表示例.xlsx](samples/集团公司融资情况表示例.xlsx)，里面是虚构数据，仅用于演示字段格式。
- 推荐入口是 `start_tray.bat`，启动后会在 Windows 右下角显示托盘图标。
- 服务默认端口是 `8780`，局域网访问格式是 `http://服务端电脑IP:8780`。

## 下载安装

### GitHub Release 用户

1. 在 GitHub Releases 页面下载 `treasury-finance-monitor-版本号.zip`。
2. 解压到服务端电脑的任意目录。
3. 双击 `start_tray.bat`。
4. 右键右下角 `Treasury Finance Monitor` 托盘图标，打开局域网地址或复制局域网地址。
5. 在页面右上角“导入台账”上传最新融资情况表。

### 从源码运行

如果是从源码克隆：

```bat
git clone https://github.com/YihanCell/treasury-finance-monitor.git
cd treasury-finance-monitor
pip install -r requirements.txt
start_tray.bat
```

本项目当前的 `.bat` 默认使用本机 Codex runtime 的 Python 路径。如果换电脑运行，请确认 `start_dashboard.bat`、`start_lan_dashboard.bat`、`finance_dashboard_tray.ps1` 中的 Python 路径存在；如果不存在，改为那台电脑实际可用的 Python 路径。

## 最快使用方式

### 1. 启动托盘

双击：

```bat
start_tray.bat
```

右下角会出现 `Treasury Finance Monitor` 托盘图标。右键图标可以：

- 查看服务状态
- 启动服务
- 停止服务
- 重启服务
- 打开本机看盘
- 打开局域网看盘
- 复制局域网地址
- 开启/关闭开机自启
- 查看当前设置

也保留了中文入口：

```bat
启动融资看盘托盘.bat
```

如果 Windows 对中文脚本名处理异常，优先使用 `start_tray.bat`。

### 2. 上传融资情况表

在服务端电脑打开页面后，点击右上角“导入台账”，上传最新的“集团公司融资情况表”。

系统会读取 Excel 的第二个工作表，一般名称类似：

```text
截至2026年6月30日
```

这个工作表至少需要包含以下字段：

```text
融资主体
机构名称
融资品种
贷款余额（万元）
到期日期
```

### 3. 发给同事访问

服务端上传一次后，同事不需要再上传 Excel。直接打开局域网地址即可，例如：

```text
http://10.1.30.183:8780
```

## 示例数据

仓库提供了一个可直接导入的示例表：

[samples/集团公司融资情况表示例.xlsx](samples/集团公司融资情况表示例.xlsx)

示例表包含：

- 流贷、固贷、项目贷款、银团贷款
- 公司债、中期票据
- 7天内、8-30天、31-60天、61-90天、91-180天、181-365天、一年后等到期区间
- 不同利率区间和不同融资主体

这份表只是为了演示字段结构和看盘效果，不包含真实业务数据。

## 功能概览

- 当前融资余额
- 融资笔数
- 一年内到期金额
- 加权平均融资成本
  - 全部
  - 债券
  - 流贷
  - 固贷
  - 贷款
  - 三年及以下
  - 三年以上
- 到期压力
  - 已到期
  - 7天内
  - 8-30天
  - 31-60天
  - 61-90天
  - 91-180天
  - 181-365天
  - 一年后
- 利率分层
- 融资品种结构
- 一年内到期品种
- 主体集中度 TOP10
- 明细筛选、排序、合计
- 导出对外融资明细
- 导出当前筛选后的融资明细

## 导出说明

### 获取融资明细

顶部按钮“获取融资明细”用于导出对外提供的融资明细。

导出内容包含：

- 融资主体
- 机构名称
- 融资品种
- 贷款余额
- 到期日期

该导出会排除公司债、企业债、债券、中期票据等债券类内容。

### 导出当前筛选

明细表右上角“导出当前筛选”用于导出当前页面筛选后的完整明细。导出的 Excel 会包含当前筛选结果，并在最后增加合计行。

## 启动脚本说明

### 推荐入口：`start_tray.bat`

执行顺序：

1. 调用 `start_tray.vbs`。
2. 隐藏启动 `finance_dashboard_tray.ps1`。
3. 创建 Windows 托盘图标。
4. 自动启动司库融资看板服务。
5. 最多等待 30 秒确认服务启动。
6. 每 5 秒检查一次服务状态。
7. 可在托盘菜单中设置开机自启。

托盘脚本使用英文菜单文本，避免 Windows PowerShell 在不同系统编码下把中文脚本内容读成乱码。

### 简易局域网入口：`start_lan_dashboard.bat`

适合不使用托盘时临时启动。它会：

1. 设置 `FINANCE_DASHBOARD_HOST=0.0.0.0`。
2. 设置 `FINANCE_DASHBOARD_PORT=8780`。
3. 清理占用 `8780` 的旧服务。
4. 隐藏启动后台服务。
5. 弹出局域网访问地址。

### 本机入口：`start_dashboard.bat`

仅在服务端电脑自己查看时使用。它会绑定：

```text
127.0.0.1:8780
```

### 停止服务：`stop_dashboard.bat`

用于关闭占用 `8780` 端口的看盘服务。

## 数据与代码分离

以下运行数据不会提交到 GitHub：

```text
uploads/
data/
*.log
__pycache__/
dist/
```

当前看盘数据会优先保存到：

```text
data/current_payload.json
```

如果服务进程没有权限写入项目 `data` 目录，会自动使用后备位置：

```text
C:\tmp\finance-dashboard\current_payload.json
```

## 发布打包

维护者可以用脚本生成 Release zip：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package_release.ps1 -Version v0.3.1
```

输出文件：

```text
dist/treasury-finance-monitor-v0.3.1.zip
```

这个 zip 可以上传到 GitHub Release，供同事下载解压使用。

## 常见问题

### 同事打不开局域网地址

先确认服务端电脑能打开：

```text
http://127.0.0.1:8780
```

如果本机能打开、同事打不开，通常是防火墙或网络问题。可以尝试：

1. 双击 `开放局域网访问_8780.bat`。
2. 确认同事和服务端电脑在同一局域网。
3. 确认同事访问的是服务端当前 IP，例如 `http://10.1.30.183:8780`。

### 页面显示尚未上传数据

说明服务端还没有当前融资情况表缓存。管理员在服务端页面上传一次最新融资情况表即可。

### 上传后没有变化

请确认上传的是“集团公司融资情况表”，并且第二个工作表字段符合示例表结构。可以先用 [samples/集团公司融资情况表示例.xlsx](samples/集团公司融资情况表示例.xlsx) 测试。

### 双击托盘入口没有反应

优先使用英文入口：

```bat
start_tray.bat
```

如果仍然没有托盘图标，可以打开任务管理器确认是否已有 `powershell.exe` 托盘进程；也可以先运行 `stop_dashboard.bat`，再重新启动托盘。

## 主要文件

```text
server.py                    后端服务、Excel 解析、导出接口
static/index.html            页面结构
static/styles.css            页面样式
static/app.js                前端交互、筛选、图表联动
samples/集团公司融资情况表示例.xlsx 示例融资情况表
docs/images/dashboard-sample.png README 截图
start_tray.bat               托盘启动入口（推荐）
start_tray.vbs               隐藏启动托盘
finance_dashboard_tray.ps1   托盘控制器
start_lan_dashboard.bat      局域网简易启动入口
start_dashboard.bat          本机启动入口
stop_dashboard.bat           停止服务
scripts/package_release.ps1  Release 打包脚本
```
