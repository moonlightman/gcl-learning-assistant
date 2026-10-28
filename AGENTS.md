# 维护约定

- 最新安装入口固定为根目录 `鑫知海-自动继续学习.user.js`，不得更改名称、namespace、更新和下载地址。
- 每次发布提高 @version，并同步界面显示版本、learning.meta.js、README、CHANGELOG。
- 版本原样归档为 versions/gcl-learning-X.Y.user.js；不覆盖历史文件，更新 sha256.json，并创建 vX.Y 标签。
- 不提交 API Key、浏览器存储、培训材料、账号资料或截图。
- 页面适配优先采用控件语义；不得把未知完成状态当作完成，不自动进入或提交考试。
- 发布前运行所有脚本语法检查和有意义的现有回归测试。分别说明模拟、真实页面及真实接口验证范围。
- 推送到现有公开仓库 moonlightman/gcl-learning-assistant；保留历史，不强制推送。
