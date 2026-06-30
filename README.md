# 企业融资情况数据看板

一句话说明：这是一个本地/局域网运行的融资台账看板。

它把人工维护的 Excel 融资情况表转成浏览器里的看板，用于查看融资余额、到期压力、融资成本、融资结构和明细数据。项目默认在服务端电脑本机或局域网内运行，业务数据不上传外部平台。

![企业融资情况数据看板示例](docs/images/dashboard-sample.png)

## 适合什么场景

- 融资台账仍由 Excel 人工维护
- 希望团队成员通过浏览器查看融资余额、到期压力、融资成本
- 数据不希望上传外部平台

## 快速开始

### 普通用户：下载 Release 使用

1. 在 GitHub Releases 页面下载最新的 `corporate-financing-dashboard-版本号.zip`。
2. 解压到服务端电脑的任意目录。
3. 双击 `start.bat`。
4. 右键 Windows 右下角 `Corporate Financing Dashboard` 托盘图标，打开本机看板或复制局域网地址。
5. 在页面右上角点击“导入台账”，上传最新融资情况表。

服务默认端口是 `8780`。本机看板地址通常是：

```text
http://127.0.0.1:8780
```

如果这台服务端电脑从未运行过本项目，请先完成下一小节的新电脑准备；已经配置过 Python 和依赖的电脑可以直接双击 `start.bat`。

### 部署使用者：新电脑前置准备

换电脑或首次部署到新电脑时，需要先安装 Python 3，并在项目目录执行：

```bat
python -m pip install -r requirements.txt
```

### 开发者：从源码运行

```bat
git clone https://github.com/YihanCell/corporate-financing-dashboard.git
cd corporate-financing-dashboard
python -m pip install -r requirements.txt
start.bat
```

## Excel 表格要求

系统读取 Excel 的第二个工作表。Excel 至少需要有两个工作表，第二个工作表一般名称类似：

```text
截至2026年6月30日
```

第二个工作表至少需要包含以下字段：

```text
融资主体
机构名称
融资品种
贷款余额（万元）
到期日期
```

项目仓库提供了示例表，可用于测试字段格式：

[samples/企业融资情况表示例.xlsx](samples/企业融资情况表示例.xlsx)

示例表使用虚构数据，仅用于演示字段结构和看板效果，不包含真实业务数据。

## 局域网访问方式

管理员在服务端电脑上传一次融资情况表后，同事不需要重复上传 Excel。只要同事和服务端电脑在同一局域网内，打开下面格式的地址即可查看：

```text
http://服务端IP:8780
```

例如：

```text
http://10.1.30.183:8780
```

服务端 IP 可以通过右键托盘图标，选择“复制局域网地址”获取。

## 功能概览

- 余额：当前融资余额、融资笔数、一年内到期金额
- 到期压力：已到期、7 天内、8-30 天、31-60 天、61-90 天、91-180 天、181-365 天、一年后
- 融资成本：加权平均融资成本，支持全部、债券、流贷、固贷、贷款、三年及以下、三年以上口径
- 结构分析：利率分层、融资品种结构、一年内到期品种、主体集中度 TOP10
- 明细筛选：按主体、机构、品种、到期区间、用途和备注筛选，并支持排序、合计
- 导出：导出对外融资明细，或导出当前筛选后的融资明细

顶部按钮“获取融资明细”用于导出对外提供的融资明细，内容包含融资主体、机构名称、融资品种、贷款余额、到期日期，并会排除公司债、企业债、债券、中期票据等债券类内容。

明细表右上角“导出当前筛选”用于导出当前页面筛选后的完整明细。导出的 Excel 会包含当前筛选结果，并在最后增加合计行。

## 数据安全说明

- 数据只保存在服务端电脑，不上传外部平台。
- 上传后的当前看板数据优先保存在 `data/current_payload.json`。
- 如果服务进程没有权限写入项目 `data` 目录，会自动使用后备位置 `C:\tmp\corporate-financing-dashboard\current_payload.json`。
- 运行数据不会提交到 GitHub：`data/`、`uploads/`、`*.log`、`dist/` 已被 `.gitignore` 排除。
- 示例 Excel 是虚构数据，可以提交；真实融资台账不要放进仓库。

## 常见问题

### 同事打不开局域网地址

先确认服务端电脑自己能打开：

```text
http://127.0.0.1:8780
```

如果服务端能打开、同事打不开，通常是 IP、网络或防火墙问题。可以按顺序检查：

1. 右键托盘图标，复制当前局域网地址，确认同事访问的是服务端当前 IP。
2. 确认同事和服务端电脑在同一个局域网。
3. 运行 `scripts/windows/allow_lan_access_8780.bat`，尝试开放 Windows 防火墙的 `8780` 端口。
4. 确认服务没有被关闭，托盘菜单里的状态应显示正在运行。

### 页面显示尚未上传数据

说明服务端还没有当前融资情况表缓存。管理员在服务端页面上传一次最新融资情况表即可。

### 上传后没有变化

请确认上传的是 `.xlsx` 融资情况表，并且第二个工作表包含必填字段。也可以先用 [samples/企业融资情况表示例.xlsx](samples/企业融资情况表示例.xlsx) 测试。

如果同事页面没有变化，让同事刷新浏览器；也要确认他们打开的是当前服务端电脑的局域网地址。

### 找不到 Python

换电脑使用时，请安装 Python 3，并在项目目录执行：

```bat
python -m pip install -r requirements.txt
```

如果双击 `start.bat` 后提示找不到 Python，通常是 Python 没有安装，或安装时没有加入系统 `PATH`。安装完成后重新打开终端或重新双击 `start.bat`。

## 维护者说明

### 发布打包

维护者可以用脚本生成 Release zip：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/package_release.ps1 -Version v0.3.2
```

输出文件：

```text
dist/corporate-financing-dashboard-v0.3.2.zip
```

这个 zip 可以上传到 GitHub Release，供同事下载解压使用。`dist/` 已被 `.gitignore` 排除，不提交到 GitHub。

### 文件结构

```text
README.md                         项目说明
requirements.txt                  Python 依赖
server.py                         后端服务、Excel 解析、导出接口
start.bat                         推荐启动入口，启动托盘程序
stop.bat                          停止服务
static/                           前端页面、样式和交互
samples/企业融资情况表示例.xlsx    示例融资情况表
docs/images/dashboard-sample.png  README 截图
docs/release-notes/               Release 说明
scripts/package_release.ps1       Release 打包脚本
scripts/create_sample_workbook.py 生成示例 Excel
scripts/capture_readme_screenshots.mjs 生成 README 截图
scripts/windows/                  Windows 托盘、启动、防火墙辅助脚本
```

### Release 脚本说明

`scripts/package_release.ps1` 会把以下内容复制到 `dist/corporate-financing-dashboard-版本号/`，再压缩为同名 zip：

```text
README.md
requirements.txt
server.py
start.bat
stop.bat
static/
samples/
docs/
scripts/
```

打包前会清理同版本旧目录和旧 zip；打包时不会包含运行中的 `data/`、`uploads/`、日志文件或 `dist/` 历史输出。
