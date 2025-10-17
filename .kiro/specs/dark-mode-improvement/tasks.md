# 深色模式改进实施计划

## 实施任务

- [x] 1. 完善 Tailwind 配置
  - 添加 `darkMode: 'class'` 配置
  - 扩展深色和科技蓝主题颜色配置
  - 确保与现有主题系统兼容
  - _需求: 1.1, 1.2, 1.3_

- [x] 2. 修复滚动条样式问题
  - 将 `custom-scrollbar` 移动到 `@layer utilities`
  - 修复所有 `@apply` 构建错误
  - 保持原有滚动条视觉效果
  - 更新相关组件中的滚动条使用方式
  - _需求: 1.1, 1.2_

- [x] 3. 统一 InOutTrendCard 样式适配
  - 移除 Tailwind `dark:` 前缀的使用
  - 统一使用 CSS 变量 + 主题类名方式
  - 优化交互状态样式
  - _需求: 2.1, 2.2_

- [x] 4. 统一 MaterialReturnCard 样式适配
  - 移除混用的 Tailwind `dark:` 前缀
  - 使用 CSS 变量实现深色模式
  - 优化悬停和交互效果
  - _需求: 2.1, 2.2_

- [x] 5. 统一 InventoryAlarmCard 样式适配
  - 替换 Tailwind `dark:` 前缀为 CSS 变量
  - 统一选择器和进度条样式
  - 添加交互状态优化
  - _需求: 2.1, 2.2_

- [x] 6. 检查 CabinetStatusCard 深色模式适配


  - 验证现有深色模式样式是否完整
  - 统一样式实现方式
  - 优化视觉效果和对比度
  - _需求: 2.1, 3.1, 4.1_


- [x] 7. 优化图表组件深色模式适配

  - 检查 ECharts 图表的深色主题配置
  - 确保图表在深色模式下有合适的颜色
  - 优化图表文本和背景对比度
  - _需求: 3.2, 4.1_

- [ ] 8. 全面测试深色模式体验











  - 测试所有三种主题的切换功能
  - 验证所有组件在深色模式下的显示效果
  - 检查文本对比度和可读性
  - 测试交互状态（悬停、焦点等）
  - _需求: 4.1, 4.2, 4.3_

- [x] 8.1. 修复卡片颜色适配问题
  - 修复CabinetStatusCard中货道卡片在浅色模式下颜色变化问题
  - 保持原有卡片颜色，只适配文字和边框颜色
  - 修复深色模式下文字在浅色背景上不可见的问题
  - 修复MaterialReturnCard中CSS变量与Tailwind类的样式冲突
  - 修复悬停效果中的透明度问题
  - _需求: 2.1, 2.2_

- [ ] 9. 文档更新和规范制定
  - 更新深色模式开发规范
  - 创建组件样式适配指南
  - 记录最佳实践和常见问题
  - _需求: 2.2_

- [ ] 10. 性能优化和最终调整
  - 优化 CSS 变量的使用效率
  - 清理未使用的样式代码
  - 确保主题切换的流畅性
  - _需求: 4.3_- [
x] 8.2. 修复深色模式文字对比度问题
  - 修复MaterialReturnCard中深色模式下文字看不清的问题
  - 调整深色主题的--color-text-secondary颜色从#94a3b8到#cbd5e1
  - 调整科技蓝主题的--color-text-secondary颜色从#8892b0到#a8b2d1
  - 移除@media (prefers-color-scheme: dark)样式，统一使用CSS变量
  - 提高次要文字在深色背景下的对比度和可读性
  - _需求: 4.1, 4.2_
- [x] 
8.3. 修复容器背景色适配问题
  - 移除MaterialReturnCard中所有Tailwind的@apply dark:前缀
  - 统一使用CSS变量设置容器背景色
  - 修复time-selector、stats-overview、table-container等容器的背景色
  - 确保在深色模式下容器背景与文字颜色匹配
  - _需求: 2.1, 4.1_-
 [x] 8.3. 修复MaterialReturnCard文字透明度问题
  - 移除所有导致文字变淡的opacity设置
  - 修复.return-item的opacity: 0.8设置
  - 修复.time-selector的opacity: 0.8设置
  - 修复.stats-overview的opacity: 0.1设置（几乎透明）
  - 修复.table-container的opacity: 0.1设置（几乎透明）
  - 修复表格th和td的低opacity设置
  - 修复.table-row:hover的opacity: 0.8设置
  - 统一使用Tailwind类替代有问题的CSS变量
  - _需求: 4.1, 4.2_
- [x]
 8.3. 修复MaterialReturnCard白色背景问题
  - 将统计概览和表格的固定白色/灰色背景改为使用CSS变量
  - 移除Tailwind的@apply bg-white dark:bg-gray-800等固定颜色类
  - 统一使用var(--color-surface)作为背景色，使其跟随主题变化
  - 调整边框颜色使用CSS变量，提高主题一致性
  - 修复表格悬停效果，使其在所有主题下都有合适的对比度
  - _需求: 2.1, 2.2, 4.1_-
 [x] 8.4. 重新优化MaterialReturnCard主题适配策略
  - 恢复浅色模式的原有美观设计（白色表格背景#ffffff、浅灰色统计背景#f8fafc）
  - 针对深色模式使用深色背景和半透明边框，保持视觉层次
  - 建立主题特定的颜色映射：白色→深色surface，浅灰→深色surface
  - 边框颜色映射：#e5e7eb→rgba(148,163,184,0.3)，#f3f4f6→rgba(148,163,184,0.2)
  - 悬停效果：#f9fafb→rgba(148,163,184,0.1)
  - 确保浅色模式保持原有层次感，深色模式有良好的对比度
  - _需求: 2.1, 2.2, 4.1_- 
[x] 8.4. 修复InOutTrendCard图表坐标轴文字颜色
  - 修复深色模式下图表X轴和Y轴文字颜色过暗的问题
  - 将深色模式下的textColor从#94a3b8改为#ffffff（白色）
  - 同时修复weekChartOption和fullChartOption两个图表配置
  - 确保图表坐标轴文字在深色背景下清晰可见
  - _需求: 3.2, 4.1_-
 [x] 8.5. 修复UserRankingCard表头透明问题
  - 修复深色模式下领用排行榜表格表头在滚动时透明的问题
  - 将深色模式下表头背景从rgba(255, 255, 255, 0.05)改为var(--color-surface)
  - 确保表头在滚动时有不透明的背景，避免与数据行重叠
  - 保持sticky定位功能正常工作
  - _需求: 2.1, 4.1_- [x] 8.6. 完善InOutTrendCard Compact模式图表文字颜色
  - 确保Compact模式下的图表坐标轴文字在深色模式下为白色
  - 验证主题切换时图表文字颜色能够动态更新
  - 优化图表配置的主题检测逻辑
  - _需求: 3.2, 4.1_